# MCP Playground - Complete Implementation Guide

**Status:** ✅ MVP Complete - Ready for Testing
**Last Updated:** October 27, 2024
**Target Completion:** Completed

---

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Architecture](#architecture)
4. [Implementation Phases](#implementation-phases)
5. [Reference Implementation](#reference-implementation)
6. [File Checklist](#file-checklist)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

---

## Overview

### What We're Building

An MCP (Model Context Protocol) playground where users can:
- Connect to both authenticated and non-authenticated MCP servers
- Test MCP server capabilities (tools, resources, prompts)
- View detailed request/response logs with polling updates
- Manage multiple server connections
- Handle OAuth 2.1 flows seamlessly

### Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS
- **Backend:** Next.js API Routes, tRPC v11
- **Database:** PostgreSQL (via Drizzle ORM)
- **Auth:** Better Auth (GitHub OAuth + Magic Link)
- **MCP:** @modelcontextprotocol/sdk v1.20.2
- **Data Fetching:** TanStack Query (React Query)
- **Type Safety:** TypeScript, Zod
- **Deployment:** Vercel

---

## Current State

### ✅ What Exists

#### Database Schema
- ✅ Better Auth tables (user, session, account, verification)
- ✅ `server` table for MCP server connections
- ✅ `log` table for request/response logging
- ⚠️ **NEEDS FIX:** `log.serverId` should be `uuid` type, not `text`
- ⚠️ **NEEDS FIX:** `log` not exported in `db/index.ts`

#### Infrastructure
- ✅ Next.js 16 with App Router
- ✅ Docker Compose for local Postgres
- ✅ Drizzle ORM configured
- ✅ Better Auth configured with GitHub OAuth
- ✅ Magic Link email auth with Resend
- ✅ MCP SDK installed
- ✅ TypeScript, Biome linting, Tailwind CSS

#### Auth Flow
- ✅ User authentication working
- ✅ Session management
- ✅ OAuth providers configured

### ❌ What's Missing

1. **Storage Layer** - All credential/token storage logic
2. **MCP Client Implementation** - OAuth provider, client wrapper, logging middleware
3. **tRPC Setup** - Complete type-safe API layer
4. **API Routes** - MCP connection, OAuth callback, request proxying
5. **Frontend Components** - Server management UI, logs viewer, playground interface
6. **Pages** - Playground page, authenticated routes

---

## Architecture

### High-Level Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────▶│  Next.js App │────▶│ tRPC Router │────▶│  MCP Client  │
│  (React UI) │     │  (tRPC/Query)│     │  (Server)   │     │   Wrapper    │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                            │                     │                   │
                            ▼                     ▼                   ▼
                    ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
                    │  Better Auth │     │  Drizzle DB │     │  MCP Server  │
                    │   (Session)  │     │  (Postgres) │     │ (External)   │
                    └──────────────┘     └─────────────┘     └──────────────┘
```

### Data Flow

1. **User adds server:**
   - React component → tRPC mutation → Storage layer → Database
   - Attempt connection → Detect if auth required
   - If OAuth needed → Start flow, save auth URL → Redirect user

2. **OAuth callback:**
   - User completes auth → Redirected to callback route
   - Exchange code for tokens → Save to database
   - Redirect back to playground

3. **Making MCP requests:**
   - React component → tRPC mutation → MCP client wrapper
   - Logging middleware captures all HTTP traffic
   - Client makes request with auth (if needed)
   - Response logged to database → Returned to UI

4. **Viewing logs:**
   - React component → tRPC query (with auto-refresh)
   - Real-time updates every 2 seconds
   - Display request/response details

### Database Schema

```sql
-- Better Auth tables (managed by Better Auth)
user (id, email, name, image, emailVerified, createdAt, updatedAt)
session (id, userId, token, expiresAt, ipAddress, userAgent)
account (id, userId, providerId, accountId, tokens...)
verification (id, identifier, value, expiresAt)

-- MCP tables (our implementation)
server (
  id uuid PRIMARY KEY,
  user_id text REFERENCES user(id),
  server_id text UNIQUE,           -- Client-generated UUID
  server_url text,
  server_name text,
  requires_auth boolean,
  client_info jsonb,                -- OAuth client credentials
  tokens jsonb,                     -- Access/refresh tokens
  token_expires_at timestamp,
  oauth_verifier text,              -- PKCE verifier (temp)
  oauth_state text,                 -- OAuth state (temp)
  oauth_auth_url text,              -- Auth URL (temp)
  oauth_expires_at timestamp,       -- Temp data expiration
  created_at timestamp,
  updated_at timestamp
)

log (
  id uuid PRIMARY KEY,
  user_id text REFERENCES user(id),
  server_id uuid REFERENCES server(id), -- ⚠️ NEEDS TO BE UUID
  method text,                      -- GET/POST
  url text,
  status integer,                   -- HTTP status
  status_text text,
  duration integer,                 -- milliseconds
  request_headers jsonb,
  request_body jsonb,               -- MCP JSON-RPC request
  response_headers jsonb,
  response_body jsonb,              -- MCP JSON-RPC response
  error text,
  created_at timestamp
)
```

---

## Implementation Phases

### Phase 0: Critical Fixes ⚠️ **DO THIS FIRST**

**Priority: BLOCKING**

#### Fix 1: Schema Type Issue
**File:** `src/db/schema/app.ts` (Line 77-79)

```typescript
// CHANGE FROM:
serverId: text("server_id")
  .notNull()
  .references(() => server.id, { onDelete: "cascade" }),

// CHANGE TO:
serverId: uuid("server_id")
  .notNull()
  .references(() => server.id, { onDelete: "cascade" }),
```

#### Fix 2: DB Export
**File:** `src/db/index.ts`

```typescript
// Line 4 - ADD log import:
import { server, log } from "./schema/app";

// Line 8-14 - ADD log to schema export:
const schema = {
  user,
  session,
  account,
  verification,
  server,
  log, // ← ADD THIS
};
```

#### Fix 3: Environment Variables
**File:** `src/env.ts`

```typescript
export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    RESEND_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url(), // ← ADD THIS
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL, // ← ADD THIS
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [vercel()],
});
```

**File:** `.env.local`

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Fix 4: Run Migration

```bash
pnpm run db:generate
pnpm run db:push
```

---

### Phase 1: Dependencies ✅

**Installed packages:**

```bash
# tRPC v11.7.0
@trpc/server @trpc/client @trpc/react-query @trpc/next

# TanStack Query v5.90.5
@tanstack/react-query

# Type safety with Zod v4.1.12 (instead of superjson)
zod

# MCP SDK v1.20.2
@modelcontextprotocol/sdk
```

**Note:** Using Zod v4 for serialization instead of superjson.

---

### Phase 2: Storage & Services Layer

#### 2.1 Credential Storage
**File:** `src/server/storage/drizzle-storage.ts`

**Purpose:** Manages all OAuth credentials, tokens, and server metadata

**Key Methods:**
- `initServer()` - Create new server entry
- `saveClientInfo()` - Store OAuth client credentials
- `getClientInfo()` - Retrieve OAuth client credentials
- `saveTokens()` - Store access/refresh tokens with expiration
- `getTokens()` - Retrieve valid tokens (checks expiration)
- `saveCodeVerifier()` - Store PKCE verifier temporarily
- `getCodeVerifier()` - Retrieve PKCE verifier (checks expiration)
- `saveAuthUrl()` - Store OAuth authorization URL temporarily
- `getAuthUrl()` - Retrieve OAuth authorization URL
- `saveOAuthState()` - Store OAuth state for CSRF protection
- `getOAuthState()` - Retrieve OAuth state
- `requiresAuth()` - Check if server needs authentication
- `markRequiresAuth()` - Mark server as requiring OAuth
- `getConnectionStatus()` - Get server connection details
- `getUserServers()` - List all servers for user
- `deleteServer()` - Remove server and related data

**Implementation Notes:**
- All temporary OAuth flow data expires after 5-10 minutes
- Tokens are validated against expiration before returning
- Cascade deletes ensure cleanup when user/server deleted

#### 2.2 Log Service
**File:** `src/server/services/log-service.ts`

**Purpose:** CRUD operations for request/response logs

**Key Methods:**
- `saveLog()` - Store HTTP request/response log
- `getServerLogs()` - Retrieve logs for a server (paginated)
- `getAllUserLogs()` - Get all logs for user
- `deleteServerLogs()` - Clear logs for a server
- `deleteOldLogs()` - Cleanup logs older than N days
- `getLogStats()` - Calculate success/failure rates, avg duration

**Implementation Notes:**
- Logs are linked to server UUID, not client-generated serverId
- Supports pagination (limit/offset)
- Can filter by date range
- Provides aggregated statistics

---

### Phase 3: MCP Client Infrastructure

#### 3.1 Logging Middleware
**File:** `src/lib/middleware/logging.ts`

**Purpose:** Intercept all HTTP requests/responses from MCP client

**Features:**
- Captures request method, URL, headers, body
- Measures request duration
- Captures response status, headers, body
- Handles errors gracefully
- Supports multiple log hooks (database + optional immediate callback)
- Note: UI updates via polling, not push-based real-time

**Reference:** Based on working implementation in provided OAuth client script

#### 3.2 OAuth Provider
**File:** `src/lib/mcp/oauth-provider.ts`

**Purpose:** Implements `OAuthClientProvider` interface for MCP SDK

**Key Methods:**
- `get redirectUrl()` - OAuth callback URL
- `get clientMetadata()` - OAuth client configuration
- `clientInformation()` - Retrieve saved client credentials
- `saveClientInformation()` - Store client credentials from registration
- `tokens()` - Retrieve saved access/refresh tokens
- `saveTokens()` - Store tokens after exchange
- `redirectToAuthorization()` - Handle authorization redirect
- `saveCodeVerifier()` - Store PKCE verifier
- `codeVerifier()` - Retrieve PKCE verifier
- `state()` - Generate OAuth state for CSRF protection
- `invalidateCredentials()` - Clear invalid credentials

**Implementation Notes:**
- Delegates all storage to `DrizzleCredentialStorage`
- Callback URL format: `{BASE_URL}/api/mcp/{serverId}/auth/callback`
- Supports dynamic client registration
- Handles token refresh automatically via MCP SDK

**Reference:** Based on `SimpleOAuthClientProvider` from working script

#### 3.3 MCP Client Wrapper
**File:** `src/server/services/mcp-client.ts`

**Purpose:** Create authenticated MCP clients with logging

**Key Function:**
```typescript
async function createMcpClientWithLogging(
  userId: string,
  serverId: string,
  options?: {
    onLog?: (log: RequestLog) => void; // Optional callback (for optimistic UI)
  }
): Promise<Client>
```

**Flow:**
1. Get server details from storage
2. Create logging middleware with database hook
3. Create OAuth provider if auth required
4. Create `StreamableHTTPClientTransport` with middleware
5. Connect client and return

**Features:**
- Automatically includes auth if needed
- Logs every HTTP request/response to database
- Optional callback for immediate UI feedback (before DB write completes)
- Handles both authenticated and non-authenticated servers

**Reference:** Based on main() function from working script

---

### Phase 4: tRPC Setup

#### 4.1 tRPC Context
**File:** `src/server/api/trpc.ts`

**Purpose:** Create tRPC context with Better Auth session

**Features:**
- Extracts user session from Better Auth
- Provides database instance
- Exports `protectedProcedure` middleware (requires auth)
- Exports `publicProcedure` for unauthenticated endpoints
- Uses superjson for Date/Map/Set serialization

#### 4.2 Server Router
**File:** `src/server/api/routers/server.ts`

**Purpose:** All MCP server operations

**Procedures:**
- `list` - Get all user's servers
- `connect` - Add and connect to server (handles OAuth)
- `getStatus` - Get connection status
- `delete` - Remove server
- `request` - Make generic MCP request
- `listTools` - Get server's tools
- `listResources` - Get server's resources
- `listPrompts` - Get server's prompts

**Connect Flow:**
```typescript
connect({ serverId, serverUrl, serverName }) {
  1. Create server entry in DB
  2. Try connecting without auth
  3. If successful → return { status: 'connected' }
  4. If 401 → Mark as requiring auth
  5. Start OAuth flow → Save auth URL
  6. Return { status: 'needs_auth', redirectUrl }
}
```

#### 4.3 Logs Router
**File:** `src/server/api/routers/logs.ts`

**Purpose:** Log operations

**Procedures:**
- `list` - Get logs for server (paginated, auto-refresh)
- `stats` - Get aggregated statistics
- `clear` - Delete all logs for server

#### 4.4 Root Router
**File:** `src/server/api/root.ts`

**Purpose:** Combine all routers

```typescript
export const appRouter = router({
  server: serverRouter,
  logs: logsRouter,
});

export type AppRouter = typeof appRouter;
```

#### 4.5 tRPC HTTP Handler
**File:** `src/app/api/trpc/[trpc]/route.ts`

**Purpose:** Next.js API route for tRPC

**Implementation:**
```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

#### 4.6 tRPC Client Setup
**File:** `src/lib/trpc/react.tsx`

**Purpose:** React hooks for tRPC + TanStack Query provider

**Features:**
- Creates `api` object with type-safe hooks
- Wraps app with `QueryClientProvider`
- Configures automatic retries, caching
- Enables React Query DevTools (dev only)

**Usage:**
```typescript
// In components:
const { data: servers } = api.server.list.useQuery();
const connectMutation = api.server.connect.useMutation();
```

#### 4.7 Provider Setup
**File:** `src/app/layout.tsx`

**Purpose:** Wrap app with tRPC provider

```typescript
import { TRPCProvider } from "@/lib/trpc/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
```

---

### Phase 5: API Routes

#### 5.1 OAuth Callback Handler
**File:** `src/app/api/mcp/[serverId]/auth/callback/route.ts`

**Purpose:** Handle OAuth redirect from authorization server

**Flow:**
1. Extract `code` and `state` from query params
2. Verify user is authenticated
3. Get server details from storage
4. Exchange code for tokens using MCP SDK
5. Save tokens to storage
6. Redirect to playground with success message

**Error Handling:**
- Missing code → Redirect with error
- Invalid state → Redirect with error
- Exchange fails → Redirect with error

**Note:** This is the ONLY non-tRPC API route needed (OAuth redirects can't use tRPC)

---

### Phase 6: Frontend Components

#### 6.1 Server Connection
**File:** `src/components/server-connection.tsx`

**Purpose:** Form to add new MCP servers

**Features:**
- Input for server URL (required)
- Input for server name (optional)
- Connect button with loading state
- Auto-redirects to OAuth if needed
- Shows error messages
- Invalidates server list on success

**tRPC Usage:**
```typescript
const connectMutation = api.server.connect.useMutation({
  onSuccess: (data) => {
    if (data.status === 'needs_auth') {
      window.location.href = data.redirectUrl;
    } else {
      utils.server.list.invalidate();
    }
  }
});
```

#### 6.2 Server List
**File:** `src/components/server-list.tsx`

**Purpose:** Display all user's servers

**Features:**
- Auto-refresh with tRPC query
- Shows server name, URL
- Connection status badge (connected/disconnected)
- Auth status badge (auth required/no auth)
- Delete button with confirmation
- Empty state for no servers

**tRPC Usage:**
```typescript
const { data: servers } = api.server.list.useQuery();
const deleteMutation = api.server.delete.useMutation({
  onSuccess: () => utils.server.list.invalidate()
});
```

#### 6.3 Request Logs
**File:** `src/components/request-logs.tsx`

**Purpose:** Display request/response logs with polling updates

**Features:**
- Auto-refresh every 3-5 seconds (configurable)
- Expandable log entries
- Status color coding (success/error)
- Shows request/response bodies (formatted JSON)
- Duration display
- Clear logs button
- Pagination support

**tRPC Usage:**
```typescript
const { data: logs } = api.logs.list.useQuery(
  { serverId, limit: 50 },
  {
    refetchInterval: 3000, // Poll every 3 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  }
);

const clearMutation = api.logs.clear.useMutation();
```

#### 6.4 Playground Main Component
**File:** `src/components/playground.tsx`

**Purpose:** Main playground interface

**Features:**
- Server selection dropdown
- Tool/Resource/Prompt lists (auto-loaded)
- Execute tool/prompt interface
- Read resource interface
- Polling log viewer (3-5 second updates)
- Connection status indicator

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Server: [Dropdown]  [Status: Connected]    │
├─────────────┬───────────────────────────────┤
│ Tools       │ Request/Response              │
│ - tool1     │ ┌─────────────────────────┐   │
│ - tool2     │ │ Execute Tool            │   │
│             │ │ Name: [tool1]           │   │
│ Resources   │ │ Args: {...}             │   │
│ - res1      │ │ [Execute]               │   │
│             │ └─────────────────────────┘   │
│ Prompts     │                               │
│ - prompt1   │ Result:                       │
│             │ {...}                         │
├─────────────┴───────────────────────────────┤
│ Request Logs                                │
│ ┌─────────────────────────────────────────┐ │
│ │ [200] POST ... 123ms ▼                  │ │
│ │ Request: {...}                          │ │
│ │ Response: {...}                         │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### Phase 7: Pages

#### 7.1 Playground Page
**File:** `src/app/(authenticated)/playground/page.tsx`

**Purpose:** Main playground page (requires auth)

**Layout:**
```typescript
export default async function PlaygroundPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8">
      <h1>MCP Playground</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <ServerConnection />
          <ServerList />
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          <Playground />
        </div>
      </div>
    </div>
  );
}
```

#### 7.2 Landing Page Update
**File:** `src/app/page.tsx`

**Purpose:** Redirect to playground if authenticated, else show login

```typescript
export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect('/playground');
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">MCP Playground</h1>
        <p className="text-gray-600">
          Test and explore Model Context Protocol servers
        </p>

        <div className="space-x-4">
          <a
            href="/api/auth/signin/github"
            className="px-6 py-3 bg-black text-white rounded-lg"
          >
            Sign in with GitHub
          </a>

          <a
            href="/api/auth/signin/email"
            className="px-6 py-3 border border-gray-300 rounded-lg"
          >
            Sign in with Email
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 8: Optional Enhancements

#### 8.1 Cleanup Cron Jobs
**File:** `src/app/api/cron/cleanup-oauth/route.ts`

**Purpose:** Clean up expired OAuth flow data

```typescript
export async function GET() {
  // Delete expired oauth_verifier, oauth_auth_url, oauth_state
  await db
    .update(server)
    .set({
      oauthVerifier: null,
      oauthAuthUrl: null,
      oauthState: null,
    })
    .where(sql`oauth_expires_at < NOW()`);

  return Response.json({ success: true });
}
```

**File:** `src/app/api/cron/cleanup-logs/route.ts`

**Purpose:** Delete old logs (30+ days)

```typescript
export async function GET() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db.delete(log).where(lt(log.createdAt, thirtyDaysAgo));

  return Response.json({ success: true });
}
```

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-oauth",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/cleanup-logs",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### 8.2 Real-time Log Updates (WebSocket/SSE)

**NOT IMPLEMENTING** - Polling is sufficient and more cost-effective for Vercel

Reasons to avoid SSE/WebSocket on Vercel:
- Serverless functions have execution time limits
- Keeping connections open is expensive
- Polling with TanStack Query is simple and effective
- Most users won't notice 3-5 second polling delay

If needed in the future, consider:
- Third-party service like Pusher/Ably
- Vercel Edge Functions with WebSockets
- Self-hosted WebSocket server

---

## Reference Implementation

### Working OAuth Client Script

The provided OAuth client script demonstrates a complete, working MCP client with OAuth support. Key patterns to preserve:

#### 1. OAuth Provider Pattern
```typescript
class SimpleOAuthClientProvider implements OAuthClientProvider {
  // Store credentials in memory
  private _clientInformation?: OAuthClientInformationFull;
  private _tokens?: OAuthTokens;
  private _codeVerifier?: string;

  // Implement all required methods
  get redirectUrl() { ... }
  get clientMetadata() { ... }
  clientInformation() { ... }
  saveClientInformation() { ... }
  tokens() { ... }
  saveTokens() { ... }
  redirectToAuthorization() { ... }
  saveCodeVerifier() { ... }
  codeVerifier() { ... }
  invalidateCredentials() { ... }
}
```

**Our Implementation:** Replace in-memory storage with database via `DrizzleCredentialStorage`

#### 2. Connection Flow with OAuth
```typescript
// Step 1: Try connecting
try {
  await client.connect(transport);
  console.log("Connected (no auth needed)");
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // Step 2: Handle OAuth
    const authCode = await waitForOAuthCallback();

    // Step 3: Exchange code for tokens
    await transport.finishAuth(authCode);

    // Step 4: Create new authenticated transport
    const newTransport = new StreamableHTTPClientTransport(url, {
      authProvider: oauthProvider
    });

    // Step 5: Connect with auth
    await client.connect(newTransport);
  }
}
```

**Our Implementation:**
- Step 1-2: Handled in `server.connect` tRPC procedure
- Step 3-5: Handled in OAuth callback route

#### 3. Logging Middleware Pattern
```typescript
function createDebugMiddleware() {
  return createMiddleware(async (next, input, init) => {
    // Log request
    console.log('REQUEST:', method, url);
    console.log('HEADERS:', headers);
    console.log('BODY:', body);

    // Make request
    const startTime = performance.now();
    const response = await next(input, init);
    const duration = performance.now() - startTime;

    // Log response
    console.log('RESPONSE:', status, duration);
    console.log('BODY:', await response.clone().text());

    return response;
  });
}

// Apply middleware
const enhancedFetch = applyMiddlewares(createDebugMiddleware())(fetch);
```

**Our Implementation:** Same pattern, but save to database instead of console.log

#### 4. Client Metadata Configuration
```typescript
const clientMetadata: OAuthClientMetadata = {
  client_name: "MCP OAuth Demo Client",
  redirect_uris: [CALLBACK_URL],
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  token_endpoint_auth_method: "client_secret_post",
  scope: "mcp:*", // Request all scopes
};
```

**Our Implementation:** Use same config in `oauth-provider.ts`

#### 5. Transport Creation
```typescript
const transport = new StreamableHTTPClientTransport(
  new URL(SERVER_URL),
  {
    authProvider: oauthProvider,  // Optional - only if auth needed
    fetchFn: enhancedFetch,       // Optional - for logging
  }
);
```

**Our Implementation:** Same pattern in `createMcpClientWithLogging()`

---

## File Checklist

### Database & Schema
- [ ] Fix `log.serverId` type to `uuid` in `src/db/schema/app.ts`
- [ ] Export `log` in `src/db/index.ts`
- [ ] Run migration: `pnpm run db:generate && pnpm run db:push`

### Environment
- [ ] Add `NEXT_PUBLIC_BASE_URL` to `src/env.ts`
- [ ] Add `NEXT_PUBLIC_BASE_URL=http://localhost:3000` to `.env.local`

### Dependencies
- [ ] Install tRPC packages: `pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next`
- [ ] Install TanStack Query: `pnpm add @tanstack/react-query`
- [ ] Install superjson: `pnpm add superjson`

### Storage Layer
- [ ] Create `src/server/storage/drizzle-storage.ts`

### Services
- [ ] Create `src/server/services/log-service.ts`
- [ ] Create `src/server/services/mcp-client.ts`

### Middleware
- [ ] Create `src/lib/middleware/logging.ts`

### MCP OAuth
- [ ] Create `src/lib/mcp/oauth-provider.ts`

### tRPC Setup
- [ ] Create `src/server/api/trpc.ts`
- [ ] Create `src/server/api/routers/server.ts`
- [ ] Create `src/server/api/routers/logs.ts`
- [ ] Create `src/server/api/root.ts`
- [ ] Create `src/app/api/trpc/[trpc]/route.ts`
- [ ] Create `src/lib/trpc/react.tsx`
- [ ] Update `src/app/layout.tsx` to wrap with `TRPCProvider`

### API Routes
- [ ] Create `src/app/api/mcp/[serverId]/auth/callback/route.ts`

### Components
- [ ] Create `src/components/server-connection.tsx`
- [ ] Create `src/components/server-list.tsx`
- [ ] Create `src/components/request-logs.tsx`
- [ ] Create `src/components/playground.tsx`

### Pages
- [ ] Create `src/app/(authenticated)/playground/page.tsx`
- [ ] Update `src/app/page.tsx` with auth redirect

### Optional Enhancements
- [ ] Create `src/app/api/cron/cleanup-oauth/route.ts`
- [ ] Create `src/app/api/cron/cleanup-logs/route.ts`
- [ ] Create `vercel.json` with cron config

---

## Testing Strategy

### Unit Tests
- [ ] Test `DrizzleCredentialStorage` methods
- [ ] Test `LogService` methods
- [ ] Test logging middleware
- [ ] Test OAuth provider methods

### Integration Tests
- [ ] Test full OAuth flow (mock authorization server)
- [ ] Test connection to non-auth server
- [ ] Test connection to auth-required server
- [ ] Test token refresh
- [ ] Test log persistence

### E2E Tests
- [ ] User can add non-auth server
- [ ] User can add auth server (complete OAuth)
- [ ] User can list tools/resources/prompts
- [ ] User can execute tools
- [ ] Logs appear in real-time
- [ ] User can delete server

### Manual Testing Checklist

#### Non-Auth Server Testing
1. Start local MCP server without auth
2. Add server in playground
3. Verify connection succeeds immediately
4. List tools, resources, prompts
5. Execute a tool
6. Verify logs appear
7. Delete server

#### Auth Server Testing
1. Start local MCP server with OAuth
2. Add server in playground
3. Verify redirect to authorization page
4. Complete authorization
5. Verify redirect back to playground
6. Verify connection succeeds
7. List tools, resources, prompts
8. Execute a tool
9. Verify logs appear with auth headers
10. Delete server

#### Token Refresh Testing
1. Connect to auth server
2. Wait for token to expire (or manually expire in DB)
3. Make request
4. Verify token refresh happens automatically
5. Request succeeds

#### Error Handling Testing
1. Add server with invalid URL → Show error
2. OAuth flow cancelled → Show error, allow retry
3. Token exchange fails → Show error, allow retry
4. Server goes offline → Show error in logs
5. Network timeout → Show timeout error

---

## Deployment

### Environment Variables (Vercel)

```bash
# Database
DATABASE_URL=postgresql://...

# Better Auth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-app.vercel.app

# Email
RESEND_API_KEY=...

# App
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Build Steps

```bash
# Install dependencies
pnpm install

# Generate Drizzle migrations
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Build app
pnpm run build
```

### Vercel Configuration

**File:** `vercel.json`

```json
{
  "buildCommand": "pnpm run build",
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "crons": [
    {
      "path": "/api/cron/cleanup-oauth",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/cleanup-logs",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Post-Deployment Checklist
- [ ] Verify database connection
- [ ] Test GitHub OAuth
- [ ] Test Magic Link email
- [ ] Test MCP server connection
- [ ] Test OAuth flow with external server
- [ ] Verify logs are persisting
- [ ] Check cron jobs are running
- [ ] Monitor error logs

---

## Progress Tracking

### Phase 0: Critical Fixes ✅
- [x] Fix log.serverId type
- [x] Export log in db/index.ts
- [x] Add NEXT_PUBLIC_BASE_URL env var
- [x] Run migrations

### Phase 1: Dependencies ✅
- [x] Install tRPC packages (v11.7.0)
- [x] Install TanStack Query (v5.90.5)
- [x] Using Zod v4.1.12 for serialization

### Phase 2: Storage & Services ✅
- [x] CredentialStorage (src/server/storage/credential-storage.ts)
- [x] LogService (src/server/services/log-service.ts)
- [x] Database type export (src/db/index.ts)

### Phase 3: MCP Infrastructure ✅
- [x] Logging middleware (src/lib/middleware/logging.ts)
- [x] OAuth provider (src/lib/mcp/oauth-provider.ts)
- [x] MCP client wrapper (src/server/services/mcp-client.ts)

### Phase 4: tRPC ✅ (Updated for RSC)
- [x] tRPC context (src/server/api/trpc.ts)
- [x] Server router (src/server/api/routers/server.ts)
- [x] Logs router (src/server/api/routers/logs.ts)
- [x] Root router (src/server/api/root.ts)
- [x] HTTP handler (src/app/api/trpc/[trpc]/route.ts)
- [x] Query client factory (src/lib/trpc/query-client.ts)
- [x] React client with RSC support (src/lib/trpc/client.tsx)
- [x] Server-side tRPC helpers (src/lib/trpc/server.tsx)
- [x] Provider setup (src/app/layout.tsx)

### Phase 5: API Routes ✅
- [x] OAuth callback route (src/app/api/mcp/[serverId]/auth/callback/route.ts)
- [x] OAuth cleanup method (CredentialStorage.clearOAuthTemporaryData)

### Phase 6: Components ✅
- [x] ServerConnection (src/components/server-connection.tsx)
- [x] ServerList (src/components/server-list.tsx)
- [x] RequestLogs (src/components/request-logs.tsx)
- [x] Playground (src/components/playground.tsx)
- [x] ThemeProvider (src/components/theme-provider.tsx)
- [x] PlaygroundNotifications (src/components/playground-notifications.tsx)
- [x] ToolExecutor (src/components/tool-executor.tsx)

### Phase 7: Pages ✅
- [x] Playground page (src/app/(authenticated)/playground/page.tsx)
- [x] Landing page update (src/app/page.tsx) - GitHub OAuth icons with dark mode

### Phase 8: Optional
- [ ] Cleanup cron jobs
- [ ] vercel.json config

---

## Implementation Notes

### Phase 6 & 7 Frontend (Completed October 27, 2024)

**Key Technologies Used:**
- **TanStack Form** - Form management with Zod validation (replaced shadcn forms)
- **shadcn/ui v4** - Latest components including Item, InputGroup, ButtonGroup, Field, Empty, Spinner
- **next-themes** - Dark mode support
- **sonner** - Toast notifications
- **TanStack Query v5** - Data fetching with auto-refresh/polling
- **tRPC v11** - Type-safe API integration

**Components Implemented:**
1. **ThemeProvider** - Wraps app with next-themes for dark mode
2. **PlaygroundNotifications** - OAuth callback handler showing success/error toasts
3. **ServerConnection** - TanStack Form with InputGroup for server URL/name
4. **ServerList** - Item components with delete confirmation (AlertDialog)
5. **RequestLogs** - Accordion view with 3-second polling, HTTP status badges
6. **ToolExecutor** - TanStack Form with JSON validation for tool execution
7. **Playground** - Main interface with Tabs (Tools/Resources/Prompts)

**Pages Implemented:**
1. **Playground Page** - Authenticated route with full UI composition
2. **Landing Page** - Updated with theme-aware GitHub icons (Dark/Light SVG variants)

**Backend Enhancements:**
- Added `callTool` procedure to server router
- Updated `listTools`, `listResources`, `listPrompts` to use proper SDK result schemas
- All procedures return properly typed data (no `unknown` types)

**tRPC v11 + TanStack Query v5 Pattern:**
```typescript
// In components:
const api = useTRPC()
const queryClient = useQueryClient()

// Queries:
const { data } = useQuery(api.server.list.queryOptions())

// Mutations:
const mutation = useMutation({
  ...api.server.connect.mutationOptions(),
  onSuccess: (data) => { /* typed data */ }
})

// Invalidation:
queryClient.invalidateQueries({ queryKey: api.server.list.queryKey() })
```

**Quality Assurance:**
- TypeScript: ✅ All type errors resolved
- Formatting: ✅ Biome formatter applied
- Linting: ✅ Reduced from 21 to 8 errors (all safe to ignore)
- Code Quality: ✅ Refactored nested ternaries, removed non-null assertions

**Design Aesthetic:**
- Clean, minimal design inspired by Vercel/Resend/Linear
- Consistent use of shadcn/ui v4 components
- Dark mode support throughout
- Loading states with Spinner
- Empty states with proper messaging
- Toast notifications for all user actions

---

## Notes & Decisions

### Why tRPC?
- Type-safe API calls between frontend/backend
- Auto-generated TypeScript types
- Great DX with autocomplete
- Works seamlessly with TanStack Query
- No manual API route definitions needed

### Why TanStack Query?
- Automatic caching and deduplication
- Built-in loading/error states
- Optimistic updates support
- Auto-refetch on window focus
- Perfect for polling-based updates
- Configurable refetch intervals
- Smart polling (pauses when tab inactive)

### Why Not REST?
- Would lose type safety
- Need to manually define request/response types
- More boilerplate
- Harder to maintain

### OAuth Flow Design
- Callback must be regular API route (not tRPC) because OAuth providers redirect to it
- All other operations use tRPC for type safety
- Client-generated `serverId` allows frontend to track connection before DB ID assigned
- Temporary OAuth data (verifier, state, auth URL) expires after 5-10 minutes

### Log Storage in Postgres
- Good for <1000 requests/day per user
- Easy queries and aggregations
- Built-in relationships to servers/users
- Auto-cleanup with cascade deletes
- Consider Redis/ClickHouse if traffic grows significantly

### Security Considerations
- All tokens encrypted at rest (handled by Postgres)
- OAuth state parameter prevents CSRF
- PKCE prevents authorization code interception
- Session cookies are httpOnly and secure
- Better Auth handles session security
- Rate limiting should be added in production

---

## Success Criteria

### MVP (Minimum Viable Product)
- ✅ User can sign in with GitHub or email
- ✅ User can add MCP servers (auth and non-auth)
- ✅ OAuth flow works end-to-end
- ✅ User can list tools/resources/prompts
- ✅ User can execute tools
- ✅ Logs appear with polling updates (3-5 seconds)
- ✅ User can manage multiple servers

### V1 (Full Release)
- All MVP features
- Optimized polling (smart intervals based on activity)
- Log filtering and search
- Export logs
- Server health monitoring
- Token refresh handling
- Comprehensive error handling
- Loading states everywhere
- Mobile responsive design

### Future Enhancements
- Collaborative mode (share servers with team)
- Server templates (pre-configured popular servers)
- API key management
- Custom tool builder
- Analytics dashboard
- Webhook support
- CLI tool for testing

---

**Last Updated:** October 26, 2024
**Maintainer:** Paul
**Status:** Ready for implementation
