import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type {
  OAuthClientInformation,
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { env } from "@/env";
import type { CredentialStorage } from "@/server/storage/credential-storage";

// Convert seconds to milliseconds
const SECONDS_TO_MS = 1000;

/**
 * OAuth provider implementation for MCP SDK that stores credentials in database
 *
 * Implements the OAuthClientProvider interface required by MCP SDK,
 * delegating all storage operations to CredentialStorage.
 */
export class McpOAuthProvider implements OAuthClientProvider {
  private readonly storage: CredentialStorage;
  private readonly serverId: string;
  private readonly baseUrl: string;

  constructor(storage: CredentialStorage, serverId: string) {
    this.storage = storage;
    this.serverId = serverId;
    this.baseUrl = env.NEXT_PUBLIC_BASE_URL;
  }

  /**
   * OAuth callback URL where the MCP server will redirect after authorization
   */
  get redirectUrl(): string {
    return `${this.baseUrl}/oauth/callback`;
  }

  /**
   * OAuth client metadata - configuration for our client application
   */
  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: "MCP Playground",
      redirect_uris: [this.redirectUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none", // Public client (browser-based)
      scope: "mcp:*",
    };
  }

  /**
   * Generate OAuth state parameter for CSRF protection
   * Returns the serverId so the callback can identify which server this is for
   */
  state(): string {
    return this.serverId;
  }

  /**
   * Load saved OAuth client information (after registration)
   */
  async clientInformation(): Promise<OAuthClientInformation | undefined> {
    const info = await this.storage.getClientInfo(this.serverId);
    if (!info) {
      return;
    }

    return {
      client_id: info.client_id,
      client_secret: info.client_secret,
    };
  }

  /**
   * Save OAuth client information (from dynamic registration)
   */
  async saveClientInformation(
    clientInfo: OAuthClientInformationFull
  ): Promise<void> {
    await this.storage.saveClientInfo(this.serverId, clientInfo);
  }

  /**
   * Load saved OAuth tokens
   */
  async tokens(): Promise<OAuthTokens | undefined> {
    const tokens = await this.storage.getTokens(this.serverId);
    return tokens || undefined;
  }

  /**
   * Save OAuth tokens after successful authorization
   */
  async saveTokens(tokens: OAuthTokens): Promise<void> {
    // Calculate expiration time if expires_in is provided
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * SECONDS_TO_MS)
      : undefined;

    await this.storage.saveTokens(this.serverId, tokens, expiresAt);
  }

  /**
   * Handle redirect to authorization URL
   *
   * In a Next.js server context, we don't actually redirect here.
   * Instead, we save the URL and return it to the client via tRPC.
   * The browser will handle the actual redirect.
   */
  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    const state = this.state();

    await this.storage.saveAuthUrl(
      this.serverId,
      authorizationUrl.toString(),
      state
    );
  }

  /**
   * Save PKCE code verifier before authorization flow
   */
  async saveCodeVerifier(codeVerifier: string): Promise<void> {
    await this.storage.saveCodeVerifier(this.serverId, codeVerifier);
  }

  /**
   * Load PKCE code verifier for validating authorization result
   */
  async codeVerifier(): Promise<string> {
    const verifier = await this.storage.getCodeVerifier(this.serverId);
    if (!verifier) {
      throw new Error("Code verifier not found or expired");
    }
    return verifier;
  }
}
