import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { server } from "@/db/schema/app";

// Constants for time calculations
const SECONDS_TO_MS = 1000;
const MINUTES_TO_MS = 60 * SECONDS_TO_MS;
// OAuth temporary data expires after 10 minutes
const OAUTH_EXPIRATION_MS = 10 * MINUTES_TO_MS;

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
    await this.db
      .update(server)
      .set({
        clientInfo: {
          client_id: clientInfo.client_id,
          client_secret: clientInfo.client_secret,
          redirect_uris: clientInfo.redirect_uris || [],
          grant_types: clientInfo.grant_types,
          response_types: clientInfo.response_types,
          token_endpoint_auth_method: clientInfo.token_endpoint_auth_method,
          client_name: clientInfo.client_name,
        },
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

    return {
      client_id: result.clientInfo.client_id,
      client_secret: result.clientInfo.client_secret,
      redirect_uris: result.clientInfo.redirect_uris || [],
      grant_types: result.clientInfo.grant_types,
      response_types: result.clientInfo.response_types,
      token_endpoint_auth_method: result.clientInfo.token_endpoint_auth_method,
      client_name: result.clientInfo.client_name,
    } as OAuthClientInformationFull;
  }

  /**
   * Save OAuth tokens with expiration
   */
  async saveTokens(
    serverId: string,
    tokens: OAuthTokens,
    expiresAt?: Date
  ): Promise<void> {
    await this.db
      .update(server)
      .set({
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: tokens.token_type,
          expires_in: tokens.expires_in,
          scope: tokens.scope,
        },
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

    return {
      access_token: result.tokens.access_token,
      refresh_token: result.tokens.refresh_token,
      token_type: result.tokens.token_type,
      expires_in: result.tokens.expires_in,
      scope: result.tokens.scope,
    } as OAuthTokens;
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
}
