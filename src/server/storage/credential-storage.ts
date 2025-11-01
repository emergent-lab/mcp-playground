import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { server } from "@/db/schema/app";
import type { Ciphertext } from "@/lib/encryption";
import {
  DecryptionError,
  decrypt,
  encrypt,
  isCiphertext,
} from "@/lib/encryption";

// Constants for time calculations
const SECONDS_TO_MS = 1000;
const MINUTES_TO_MS = 60 * SECONDS_TO_MS;
// OAuth temporary data expires after 10 minutes
const OAUTH_EXPIRATION_MS = 10 * MINUTES_TO_MS;

type EncryptedTokens = {
  access_token: Ciphertext;
  refresh_token?: Ciphertext;
  token_type: string;
  expires_in?: number;
  scope?: string;
};

type EncryptedClientInfo = {
  client_id: string;
  client_secret?: Ciphertext;
  redirect_uris: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
  client_name?: string;
};

class CredentialDecryptionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CredentialDecryptionError";
  }
}

class MissingTokenError extends Error {
  constructor() {
    super("Cannot persist OAuth tokens without an access_token");
    this.name = "MissingTokenError";
  }
}

export class CredentialStorage {
  private readonly userId: string;
  private readonly db: Database;

  constructor(userId: string, db: Database) {
    this.userId = userId;
    this.db = db;
  }

  /**
   * Initialize a new server entry for the user
   */
  async initServer(
    serverId: string,
    serverUrl: string,
    serverName?: string
  ): Promise<void> {
    await this.db.insert(server).values({
      userId: this.userId,
      serverId,
      serverUrl,
      serverName,
      requiresAuth: false,
    });
  }

  /**
   * Save OAuth client information after dynamic registration
   */
  async saveClientInfo(
    serverId: string,
    clientInfo: OAuthClientInformationFull
  ): Promise<void> {
    const encryptedClientInfo: EncryptedClientInfo = {
      client_id: clientInfo.client_id,
      client_secret: clientInfo.client_secret
        ? encrypt(clientInfo.client_secret)
        : undefined,
      redirect_uris: clientInfo.redirect_uris ?? [],
      grant_types: clientInfo.grant_types,
      response_types: clientInfo.response_types,
      token_endpoint_auth_method: clientInfo.token_endpoint_auth_method,
      client_name: clientInfo.client_name,
    };

    await this.db
      .update(server)
      .set({
        clientInfo: encryptedClientInfo,
      })
      .where(
        and(eq(server.userId, this.userId), eq(server.serverId, serverId))
      );
  }

  /**
   * Get OAuth client information
   */
  async getClientInfo(
    serverId: string
  ): Promise<OAuthClientInformationFull | null> {
    const result = await this.db.query.server.findFirst({
      where: (t, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(t.userId, this.userId), eqOp(t.serverId, serverId)),
    });

    if (!result?.clientInfo) {
      return null;
    }

    const encrypted = result.clientInfo as EncryptedClientInfo;
    let clientSecret: string | undefined;

    if (encrypted.client_secret) {
      if (!isCiphertext(encrypted.client_secret)) {
        throw new CredentialDecryptionError(
          `Client secret for server ${serverId} is not encrypted`
        );
      }

      try {
        clientSecret = decrypt(encrypted.client_secret);
      } catch (error) {
        throw new CredentialDecryptionError(
          `Failed to decrypt client secret for server ${serverId}`,
          { cause: error instanceof Error ? error : undefined }
        );
      }
    }

    return {
      client_id: encrypted.client_id,
      client_secret: clientSecret,
      redirect_uris: encrypted.redirect_uris ?? [],
      grant_types: encrypted.grant_types,
      response_types: encrypted.response_types,
      token_endpoint_auth_method: encrypted.token_endpoint_auth_method,
      client_name: encrypted.client_name,
    };
  }

  /**
   * Save OAuth tokens with expiration
   */
  async saveTokens(
    serverId: string,
    tokens: OAuthTokens,
    expiresAt?: Date
  ): Promise<void> {
    if (!tokens.access_token) {
      throw new MissingTokenError();
    }

    const encryptedTokens: EncryptedTokens = {
      access_token: encrypt(tokens.access_token),
      refresh_token: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : undefined,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
    };

    await this.db
      .update(server)
      .set({
        tokens: encryptedTokens,
        tokenExpiresAt: expiresAt,
      })
      .where(
        and(eq(server.userId, this.userId), eq(server.serverId, serverId))
      );
  }

  /**
   * Get OAuth tokens (returns null if expired)
   */
  async getTokens(serverId: string): Promise<OAuthTokens | null> {
    const result = await this.db.query.server.findFirst({
      where: (t, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(t.userId, this.userId), eqOp(t.serverId, serverId)),
    });

    if (!result?.tokens) {
      return null;
    }

    // Check if tokens are expired
    if (result.tokenExpiresAt && result.tokenExpiresAt < new Date()) {
      return null;
    }

    const encrypted = result.tokens as EncryptedTokens;

    if (!(encrypted.access_token && isCiphertext(encrypted.access_token))) {
      throw new CredentialDecryptionError(
        `Stored access token for server ${serverId} is not encrypted`
      );
    }

    try {
      const accessToken = decrypt(encrypted.access_token);
      let refreshToken: string | undefined;

      if (encrypted.refresh_token) {
        if (!isCiphertext(encrypted.refresh_token)) {
          throw new CredentialDecryptionError(
            `Stored refresh token for server ${serverId} is not encrypted`
          );
        }
        refreshToken = decrypt(encrypted.refresh_token);
      }

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: encrypted.token_type,
        expires_in: encrypted.expires_in,
        scope: encrypted.scope,
      };
    } catch (error) {
      if (error instanceof CredentialDecryptionError) {
        throw error;
      }

      if (error instanceof DecryptionError) {
        throw new CredentialDecryptionError(
          `Failed to decrypt tokens for server ${serverId}`,
          { cause: error }
        );
      }

      throw error;
    }
  }

  /**
   * Save PKCE code verifier (temporary, expires in 10 minutes)
   */
  async saveCodeVerifier(
    serverId: string,
    verifier: string,
    expiresAt?: Date
  ): Promise<void> {
    const expirationTime =
      expiresAt || new Date(Date.now() + OAUTH_EXPIRATION_MS);

    await this.db
      .update(server)
      .set({
        oauthVerifier: verifier,
        oauthExpiresAt: expirationTime,
      })
      .where(
        and(eq(server.userId, this.userId), eq(server.serverId, serverId))
      );
  }

  /**
   * Get PKCE code verifier (returns null if expired)
   */
  async getCodeVerifier(serverId: string): Promise<string | null> {
    const result = await this.db.query.server.findFirst({
      where: (t, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(t.userId, this.userId), eqOp(t.serverId, serverId)),
    });

    if (!result?.oauthVerifier) {
      return null;
    }

    // Check if verifier is expired
    if (result.oauthExpiresAt && result.oauthExpiresAt < new Date()) {
      return null;
    }

    return result.oauthVerifier;
  }

  /**
   * Save OAuth authorization URL and state (temporary, expires in 10 minutes)
   */
  async saveAuthUrl(
    serverId: string,
    authUrl: string,
    state: string,
    expiresAt?: Date
  ): Promise<void> {
    const expirationTime =
      expiresAt || new Date(Date.now() + OAUTH_EXPIRATION_MS);

    await this.db
      .update(server)
      .set({
        oauthAuthUrl: authUrl,
        oauthState: state,
        oauthExpiresAt: expirationTime,
      })
      .where(
        and(eq(server.userId, this.userId), eq(server.serverId, serverId))
      );
  }

  /**
   * Get OAuth authorization URL (returns null if expired)
   */
  async getAuthUrl(serverId: string): Promise<string | null> {
    const result = await this.db.query.server.findFirst({
      where: (t, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(t.userId, this.userId), eqOp(t.serverId, serverId)),
    });

    if (!result?.oauthAuthUrl) {
      return null;
    }

    // Check if auth URL is expired
    if (result.oauthExpiresAt && result.oauthExpiresAt < new Date()) {
      return null;
    }

    return result.oauthAuthUrl;
  }

  /**
   * Get OAuth state for CSRF protection
   */
  async getOAuthState(serverId: string): Promise<string | null> {
    const result = await this.db.query.server.findFirst({
      where: (t, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(t.userId, this.userId), eqOp(t.serverId, serverId)),
    });

    return result?.oauthState || null;
  }

  /**
   * Mark whether server requires authentication
   */
  async markRequiresAuth(
    serverId: string,
    requiresAuth: boolean
  ): Promise<void> {
    await this.db
      .update(server)
      .set({ requiresAuth })
      .where(
        and(eq(server.userId, this.userId), eq(server.serverId, serverId))
      );
  }

  /**
   * Get full server record
   */
  getServer(serverId: string) {
    return this.db.query.server.findFirst({
      where: (t, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(t.userId, this.userId), eqOp(t.serverId, serverId)),
    });
  }

  /**
   * Get all servers for the user
   */
  getUserServers() {
    return this.db.query.server.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, this.userId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  /**
   * Delete a server and all related data
   */
  async deleteServer(serverId: string): Promise<void> {
    await this.db
      .delete(server)
      .where(
        and(eq(server.userId, this.userId), eq(server.serverId, serverId))
      );
  }

  /**
   * Clear temporary OAuth flow data after successful authentication
   *
   * This removes the code verifier, state, auth URL, and expiration
   * that were temporarily stored during the OAuth flow.
   */
  async clearOAuthTemporaryData(serverId: string): Promise<void> {
    await this.db
      .update(server)
      .set({
        oauthVerifier: null,
        oauthState: null,
        oauthAuthUrl: null,
        oauthExpiresAt: null,
      })
      .where(
        and(eq(server.userId, this.userId), eq(server.serverId, serverId))
      );
  }
}
