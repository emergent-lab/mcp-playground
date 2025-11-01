<p align="center">
  <picture>
    <source srcset="public/icon0.svg" media="(prefers-color-scheme: dark)">
    <img src="public/icon0.svg" alt="MCP Playground Logo" width="64"/>
  </picture>
</p>

# MCP Playground

An Open-Source Web-Based Tool for Testing and Inspecting MCP Servers

## What is MCP Playground?

MCP Playground is a **web-based** developer tool designed to inspect and test Model Context Protocol (MCP) servers. It provides an interactive environment for exploring tools, resources, and prompts exposed by MCP servers, making it easy to debug and develop MCP integrations.

**Key Features:**
- 🌐 **Web-Based Interface** - No CLI required, test MCP servers directly from your browser
- 🔌 **HTTP Transport Support** - Works with HTTP-based and supports stateless MCP interactions
- 🔧 **Interactive Testing** - Execute tools, view resources, and test prompts in real-time
- 📊 **Request Logging** - Track all JSON-RPC requests and responses for debugging
- 🔒 **OAuth Integration** - Secure OAuth flows for MCP servers that require authentication
- 👥 **Flexible Authentication** - Use anonymously without signing in, or create an account (GitHub OAuth, Magic Link) for persistent data and cross-device access

## Why MCP Playground?

MCP Playground was built out of a need for a quick, easy way to inspect and test MCP servers without dealing with complex CLI setups or writing custom scripts every time. When developing with MCP, there was a clear need for a simple web interface to:

- **Quickly connect** to any MCP server and see what it exposes
- **Test tools and prompts** interactively without writing code
- **Debug OAuth flows** when integrating with authenticated servers
- **View request/response logs** to understand what's happening under the hood
- **Switch between servers** easily while working on multiple projects

Instead of rebuilding these capabilities for each project, this tool was made open source so anyone working with MCP can benefit from it. It's the tool that should exist for anyone working with Model Context Protocol.

## Tech Stack

MCP Playground is built with modern and reliable technologies:

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Shadcn UI
- **Backend**: tRPC, Node.js, Drizzle ORM
- **Database**: PostgreSQL 17
- **Authentication**: Better Auth (GitHub OAuth, Magic Link, Anonymous)
- **Email**: React Email with Resend
- **MCP Integration**: @modelcontextprotocol/sdk
- **Code Quality**: Ultracite (AI-ready linter), Biome

## Getting Started

### Prerequisites

**Required Versions:**

- [Node.js](https://nodejs.org/en/download) (v18 or higher)
- [pnpm](https://pnpm.io) (v10 or higher)
- [Docker](https://docs.docker.com/engine/install/) (v20 or higher)

Before running the application, you'll need to set up services and configure environment variables. For more details on environment variables, see the [Environment Variables](#environment-variables) section.

### Quick Start Guide

1. **Clone and Install**

   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/mcp-playground.git
   cd mcp-playground

   # Install dependencies
   pnpm install
   ```

2. **Set Up Environment**

   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Database
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mcp-playground"

   # Better Auth
   BETTER_AUTH_SECRET="your_secret_key"  # Generate with: openssl rand -hex 32
   BETTER_AUTH_URL="http://localhost:3000"

   # GitHub OAuth (Required for GitHub login)
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"

   # Resend (Required for Magic Link authentication)
   RESEND_API_KEY="your_resend_api_key"
   ```

3. **Start Database**

   ```bash
   pnpm docker:db:up
   ```

4. **Initialize Database**

   ```bash
   pnpm db:push
   ```

5. **Start the App**

   ```bash
   pnpm dev
   ```

6. **Open in Browser**

   Visit [http://localhost:3000](http://localhost:3000)

## Environment Setup

### 1. Better Auth Setup

Generate a secure secret key for Better Auth:

```bash
openssl rand -hex 32
```

Add to `.env.local`:

```env
BETTER_AUTH_SECRET="your_generated_secret"
BETTER_AUTH_URL="http://localhost:3000"  # Change to your production URL in production
```

### 2. GitHub OAuth Setup (Required for GitHub Login)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: MCP Playground (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (development) or your production URL
   - **Authorization callback URL**:
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://your-production-url/api/auth/callback/github`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret
6. Add to `.env.local`:

   ```env
   GITHUB_CLIENT_ID="your_client_id"
   GITHUB_CLIENT_SECRET="your_client_secret"
   ```

> [!WARNING]
> The authorization callback URL must match **exactly** what you configure in `.env.local`, including the protocol (http/https), domain, and path.

### 3. Resend Setup (Required for Magic Link Authentication)

1. Go to [Resend](https://resend.com/)
2. Create an account or sign in
3. Navigate to API Keys in your dashboard
4. Create a new API key
5. Add to `.env.local`:

   ```env
   RESEND_API_KEY="re_..."
   ```

> [!NOTE]
> Magic Link authentication requires a verified domain in Resend for production use. In development, you can use Resend's test mode.

## Database Setup

MCP Playground uses PostgreSQL for storing server connections, user data, and request logs.

### Start the Database

Run this command to start a local PostgreSQL instance via Docker:

```bash
pnpm docker:db:up
```

This creates a database with:
- **Container**: `mcp-playground-db`
- **Database**: `mcp-playground`
- **Username**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`

### Database Commands

- **Set up database tables**:
  ```bash
  pnpm db:push
  ```

- **Create migration files** (after schema changes):
  ```bash
  pnpm db:generate
  ```

- **Apply migrations**:
  ```bash
  pnpm db:migrate
  ```

- **View database content** (Drizzle Studio):
  ```bash
  pnpm db:studio
  ```

- **Stop database**:
  ```bash
  pnpm docker:db:stop
  ```

- **Remove database and volumes**:
  ```bash
  pnpm docker:db:clean
  ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth encryption | Yes |
| `BETTER_AUTH_URL` | Base URL for authentication callbacks | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth application client ID | For GitHub login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth application client secret | For GitHub login |
| `RESEND_API_KEY` | Resend API key for sending magic link emails | For Magic Link auth |

## Common Commands

### Development
- `pnpm dev:all` - Start PostgreSQL container and Next.js dev server
- `pnpm dev` - Start Next.js dev server only (requires DB running)
- `pnpm build` - Build production bundle
- `pnpm start` - Run production server

### Code Quality
- `pnpm lint` - Run Ultracite linter (check mode)
- `pnpm lint:fix` - Run Ultracite linter (fix mode)
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - Run TypeScript type checking

### Database Management
- `pnpm docker:db:up` - Start PostgreSQL container
- `pnpm docker:db:stop` - Stop PostgreSQL container
- `pnpm docker:db:down` - Stop and remove PostgreSQL container
- `pnpm docker:db:clean` - Stop, remove container and delete volumes
- `pnpm db:generate` - Generate Drizzle migrations from schema
- `pnpm db:migrate` - Run Drizzle migrations
- `pnpm db:push` - Push schema changes directly to database
- `pnpm db:studio` - Open Drizzle Studio GUI

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/auth/[...all]/       # Better Auth catch-all route
│   ├── server/[serverId]/       # Server detail page with prefetching
│   ├── oauth/callback/          # OAuth callback handler
│   └── page.tsx                 # Home page
├── components/
│   ├── playground/              # Main playground interface
│   ├── request-logs/            # Request logging UI
│   └── ui/                      # Reusable UI components
├── server/
│   ├── api/routers/             # tRPC API routes
│   ├── services/                # Business logic
│   └── storage/                 # Database access layer
├── lib/
│   ├── trpc/                    # tRPC configuration
│   ├── auth.ts                  # Better Auth config
│   └── mcp/                     # MCP client logic
├── db/
│   ├── schema/                  # Database schemas
│   └── index.ts                 # Drizzle client
└── env.ts                       # Type-safe environment variables
```

## How It Works

1. **Connect to MCP Server**: Add an MCP server by providing its HTTP endpoint and authentication details
2. **OAuth Flow**: If the server requires OAuth, MCP Playground handles the complete flow securely
3. **Explore Capabilities**: Browse available tools, resources, and prompts exposed by the server
4. **Interactive Testing**: Execute tools with custom parameters, fetch resources, and test prompts
5. **Request Logging**: View detailed JSON-RPC request/response logs for debugging
6. **Multi-Server Management**: Connect and switch between multiple MCP servers

## License

MIT License - see [LICENSE](LICENSE) file for details
