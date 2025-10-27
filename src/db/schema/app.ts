import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const server = pgTable(
  "server",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Server identification
    serverId: text("server_id").notNull(), // Client-generated UUID for this connection
    serverUrl: text("server_url").notNull(),
    serverName: text("server_name"),
    requiresAuth: boolean("requires_auth").default(false).notNull(),

    // OAuth persistent data (null for non-auth servers)
    clientInfo: jsonb("client_info").$type<{
      client_id: string;
      client_secret?: string;
      redirect_uris: string[];
      grant_types?: string[];
      response_types?: string[];
      token_endpoint_auth_method?: string;
      client_name?: string;
    }>(),

    tokens: jsonb("tokens").$type<{
      access_token: string;
      refresh_token?: string;
      token_type: string;
      expires_in?: number;
      scope?: string;
    }>(),

    tokenExpiresAt: timestamp("token_expires_at"),

    // OAuth temporary flow data (short-lived)
    oauthVerifier: text("oauth_verifier"),
    oauthState: text("oauth_state"),
    oauthAuthUrl: text("oauth_auth_url"),
    oauthExpiresAt: timestamp("oauth_expires_at"),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("mcp_server_user_id_idx").on(table.userId),
    index("mcp_server_oauth_expires_idx").on(table.oauthExpiresAt),
    // Unique constraint: one user can't have duplicate serverId
    index("mcp_server_user_server_unique_idx").on(table.userId, table.serverId),
  ]
);

export type Server = typeof server.$inferSelect;
export type NewServer = typeof server.$inferInsert;

export const log = pgTable(
  "log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serverId: uuid("server_id")
      .notNull()
      .references(() => server.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Request metadata
    method: text("method").notNull(), // GET, POST
    url: text("url").notNull(),
    status: integer("status"), // HTTP status code
    statusText: text("status_text"),
    duration: integer("duration"), // in milliseconds

    // Request/Response data
    requestHeaders: jsonb("request_headers").$type<Record<string, string>>(),
    requestBody: jsonb("request_body"), // The MCP JSON-RPC request
    responseHeaders: jsonb("response_headers").$type<Record<string, string>>(),
    responseBody: jsonb("response_body"), // The MCP JSON-RPC response

    // Error tracking
    error: text("error"),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("mcp_request_log_user_id_idx").on(table.userId),
    index("mcp_request_log_server_id_idx").on(table.serverId),
    index("mcp_request_log_created_at_idx").on(table.createdAt),
    // Composite index for querying user's logs for a specific server
    index("mcp_request_log_user_server_idx").on(table.userId, table.serverId),
  ]
);

export type Log = typeof log.$inferSelect;
export type NewLog = typeof log.$inferInsert;
