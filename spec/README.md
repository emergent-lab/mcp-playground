# MCP Playground - Specification & Documentation

This folder contains all specification and implementation documentation for the MCP Playground project.

## Documents

### [IMPLEMENTATION.md](./IMPLEMENTATION.md)
**Complete implementation guide and tracking document**

- Current state audit
- Architecture & data flow diagrams
- Phase-by-phase implementation plan
- Reference implementation from working OAuth client
- Complete file checklist with progress tracking
- Testing strategy
- Deployment guide

**Status:** 🚧 In Progress
**Last Updated:** October 26, 2024

## Quick Start

### 1. Review Current State
See [IMPLEMENTATION.md - Current State](./IMPLEMENTATION.md#current-state) for what exists and what's missing.

### 2. Phase 0: Critical Fixes (START HERE)
Before anything else, complete these fixes:

```bash
# 1. Fix schema issues in src/db/schema/app.ts
# 2. Export log in src/db/index.ts
# 3. Add NEXT_PUBLIC_BASE_URL to src/env.ts
# 4. Run migrations
pnpm run db:generate
pnpm run db:push
```

See [IMPLEMENTATION.md - Phase 0](./IMPLEMENTATION.md#phase-0-critical-fixes-do-this-first)

### 3. Follow Implementation Phases
Work through phases 1-8 in order. Each phase builds on the previous one.

See [IMPLEMENTATION.md - Implementation Phases](./IMPLEMENTATION.md#implementation-phases)

### 4. Track Progress
Use the [File Checklist](./IMPLEMENTATION.md#file-checklist) to track what's been completed.

## Architecture Overview

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

## Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS
- **Backend:** Next.js API Routes, tRPC v11
- **Database:** PostgreSQL (Drizzle ORM)
- **Auth:** Better Auth (GitHub + Magic Link)
- **MCP:** @modelcontextprotocol/sdk v1.20.2
- **Data Fetching:** TanStack Query
- **Type Safety:** TypeScript, Zod

## Key Features

- ✅ Connect to authenticated and non-authenticated MCP servers
- ✅ OAuth 2.1 flow with PKCE
- ✅ Real-time request/response logging
- ✅ Multi-server management
- ✅ Type-safe API with tRPC
- ✅ Auto-refreshing logs with TanStack Query

## Development Commands

```bash
# Start dev server
pnpm dev

# Database
pnpm run db:generate     # Generate migrations
pnpm run db:migrate      # Run migrations
pnpm run db:push         # Push schema changes
pnpm run db:studio       # Open Drizzle Studio

# Linting & Formatting
pnpm run lint            # Run linter
pnpm run lint:fix        # Fix linting issues
pnpm run format          # Format code

# Type checking
pnpm run typecheck       # Check TypeScript errors

# Better Auth
pnpm run auth:generate   # Generate auth schema

# Email
pnpm run email:dev       # Email preview server
```

## Project Structure

```
mcp-playground/
├── spec/
│   ├── IMPLEMENTATION.md       # This doc - implementation guide
│   └── README.md               # This file - quick reference
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (authenticated)/    # Auth-protected routes
│   │   ├── api/                # API routes
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   ├── db/
│   │   ├── schema/             # Drizzle schemas
│   │   └── index.ts            # DB client
│   ├── lib/
│   │   ├── mcp/                # MCP client infrastructure
│   │   ├── middleware/         # Request/response middleware
│   │   ├── trpc/               # tRPC client setup
│   │   └── auth.ts             # Better Auth config
│   └── server/
│       ├── api/                # tRPC routers
│       ├── services/           # Business logic
│       └── storage/            # Data access layer
├── emails/                     # React Email templates
└── migrations/                 # Database migrations
```

## Contributing

When implementing features:

1. ✅ Follow the phase order in IMPLEMENTATION.md
2. ✅ Check off items in the File Checklist as you complete them
3. ✅ Reference the working OAuth client script for patterns
4. ✅ Write tests for new functionality
5. ✅ Update this spec if architecture changes

## Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [tRPC Documentation](https://trpc.io/)
- [TanStack Query](https://tanstack.com/query)
- [Better Auth](https://www.better-auth.com/)
- [Drizzle ORM](https://orm.drizzle.team/)

---

**Questions or Issues?**
Refer to [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed guidance.
