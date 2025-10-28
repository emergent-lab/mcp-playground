# Phase 6 & 7: Frontend Implementation Plan

**Status:** ✅ Ready for Implementation
**Last Updated:** October 26, 2025
**Dependencies:** Phase 0-5 must be complete

---

## Overview

Build all frontend components and pages using TanStack Form, shadcn/ui v4 components (including new Item, InputGroup, ButtonGroup), tRPC hooks, and TanStack Query.

**Key Technologies:**
- **Forms:** TanStack Form with native Zod v4 validation (Standard Schema support, no adapter needed)
- **UI Components:** shadcn/ui v4 (Item, InputGroup, ButtonGroup, etc.)
- **Data Fetching:** tRPC + TanStack Query
- **Notifications:** Sonner (toast)
- **Styling:** Tailwind CSS v4

---

## Table of Contents

1. [Component Specifications](#component-specifications)
2. [Page Specifications](#page-specifications)
3. [Patterns & Best Practices](#patterns--best-practices)
4. [Implementation Order](#implementation-order)
5. [TODO Checklist](#todo-checklist)
6. [Testing Strategy](#testing-strategy)
7. [Success Criteria](#success-criteria)

---

## Component Specifications

### 6.1 Server Connection Form

**File:** `src/components/server-connection.tsx`

**Purpose:** Form to add and connect to new MCP servers with OAuth support

#### shadcn Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`
- `InputGroup`, `InputGroupInput`, `InputGroupAddon`
- `Input`
- `Button` with `Spinner`
- `toast` from Sonner

#### TanStack Form Schema

```typescript
const formSchema = z.object({
  serverUrl: z.string().url('Must be a valid URL'),
  serverName: z.string().optional(),
});

const form = useForm({
  defaultValues: { serverUrl: '', serverName: '' },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
    const serverId = crypto.randomUUID();
    connectMutation.mutate({ serverId, ...value });
  },
});
```

#### Key Features
- ✅ URL input with globe icon using `InputGroup`
- ✅ Optional server name field
- ✅ Loading state with `Spinner` in button
- ✅ Toast notifications for success/OAuth redirect
- ✅ Form reset after successful submission
- ✅ Real-time validation feedback

#### Implementation Notes
1. Use `InputGroup` for URL field with `GlobeIcon` from lucide-react
2. Show loading spinner in button during mutation
3. Handle OAuth redirect: if response has `redirectUrl`, navigate to it
4. Show toast on success: "Connected successfully!" or "Redirecting to authorize..."
5. Clear form after successful non-OAuth connection
6. Invalidate `api.server.list` query after success

#### tRPC Integration
```typescript
const connectMutation = api.server.connect.useMutation({
  onSuccess: (data) => {
    if (data.status === 'needs_auth') {
      toast.info('Redirecting to authorization...');
      window.location.href = data.redirectUrl;
    } else {
      toast.success('Connected successfully!');
      form.reset();
      utils.server.list.invalidate();
    }
  },
  onError: (error) => {
    toast.error(error.message || 'Failed to connect');
  },
});
```

---

### 6.2 Server List

**File:** `src/components/server-list.tsx`

**Purpose:** Display all user's MCP servers with status badges and delete actions

#### shadcn Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Item`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemGroup`, `ItemSeparator`
- `Badge` (status indicators)
- `Button` (delete action)
- `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`
- `Empty` (no servers state)
- `ScrollArea`

#### Layout Pattern with Item Components

```typescript
<Card>
  <CardHeader>
    <CardTitle>Connected Servers</CardTitle>
  </CardHeader>
  <CardContent>
    {servers?.length === 0 ? (
      <Empty
        title="No servers connected"
        description="Add your first MCP server to get started"
      />
    ) : (
      <ScrollArea className="h-[400px]">
        <ItemGroup>
          {servers.map((server, index) => (
            <>
              <Item key={server.id}>
                <ItemContent>
                  <ItemTitle>{server.serverName || 'Unnamed Server'}</ItemTitle>
                  <ItemDescription className="flex items-center gap-2">
                    <span className="truncate">{server.serverUrl}</span>
                    <Badge variant={server.hasTokens ? 'default' : 'secondary'}>
                      {server.hasTokens ? 'Connected' : 'Disconnected'}
                    </Badge>
                    {server.requiresAuth && <Badge variant="outline">OAuth</Badge>}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <TrashIcon className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Server?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove "{server.serverName || server.serverUrl}"
                          and all associated logs. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate({ serverId: server.id })}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </ItemActions>
              </Item>
              {index !== servers.length - 1 && <ItemSeparator />}
            </>
          ))}
        </ItemGroup>
      </ScrollArea>
    )}
  </CardContent>
</Card>
```

#### Key Features
- ✅ Auto-refresh server list
- ✅ Connection status badges (green for connected, gray for disconnected)
- ✅ OAuth badge for auth-required servers
- ✅ Delete confirmation dialog
- ✅ Empty state when no servers
- ✅ Scrollable list with max height

#### Implementation Notes
1. No form needed - display only component
2. Use `Item` components for clean, consistent list display
3. Badge colors: `default` (green) for connected, `secondary` (gray) for disconnected
4. Show OAuth badge for servers with `requiresAuth: true`
5. Confirm delete with `AlertDialog`
6. Truncate long URLs with `truncate` class

#### tRPC Integration
```typescript
const { data: servers, isLoading } = api.server.list.useQuery();

const deleteMutation = api.server.delete.useMutation({
  onSuccess: () => {
    toast.success('Server deleted');
    utils.server.list.invalidate();
  },
  onError: (error) => {
    toast.error(error.message || 'Failed to delete server');
  },
});
```

---

### 6.3 Request Logs Viewer

**File:** `src/components/request-logs.tsx`

**Purpose:** Display HTTP request/response logs with auto-refresh polling

#### shadcn Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardAction`, `CardContent`
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `Badge` (HTTP status)
- `ButtonGroup`
- `Button` (clear logs)
- `ScrollArea`
- `Empty`
- `Separator`

#### Layout Pattern

```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Request Logs</CardTitle>
      <CardAction>
        <ButtonGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate({ serverId })}
            disabled={!logs?.length}
          >
            Clear Logs
          </Button>
        </ButtonGroup>
      </CardAction>
    </div>
  </CardHeader>
  <CardContent>
    {logs?.length === 0 ? (
      <Empty
        title="No logs yet"
        description="Logs will appear here as you make requests"
      />
    ) : (
      <ScrollArea className="h-[500px]">
        <Accordion type="single" collapsible className="w-full">
          {logs.map((log) => (
            <AccordionItem key={log.id} value={log.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={getStatusVariant(log.status)}>
                    {log.status || 'ERR'}
                  </Badge>
                  <span className="font-mono">{log.method}</span>
                  <span className="truncate flex-1 text-left">{log.url}</span>
                  <span className="text-muted-foreground">{log.duration}ms</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {/* Request Details */}
                  <div>
                    <h4 className="font-semibold mb-2">Request</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(log.requestBody, null, 2)}
                    </pre>
                  </div>

                  <Separator />

                  {/* Response Details */}
                  <div>
                    <h4 className="font-semibold mb-2">Response</h4>
                    {log.error ? (
                      <div className="text-destructive">{log.error}</div>
                    ) : (
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                        {JSON.stringify(log.responseBody, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    )}
  </CardContent>
</Card>
```

#### Status Badge Variant Helper

```typescript
function getStatusVariant(status?: number): string {
  if (!status) return 'destructive';
  if (status >= 200 && status < 300) return 'default';
  if (status >= 300 && status < 400) return 'secondary';
  if (status >= 400 && status < 500) return 'outline';
  return 'destructive';
}
```

#### Key Features
- ✅ Auto-refresh every 3 seconds
- ✅ Expandable log entries with Accordion
- ✅ Color-coded HTTP status badges
- ✅ Formatted JSON display
- ✅ Request/response details
- ✅ Clear logs button
- ✅ Empty state

#### Implementation Notes
1. Use polling with `refetchInterval: 3000`
2. Status badge colors:
   - 2xx → `default` (green)
   - 3xx → `secondary` (gray)
   - 4xx → `outline` (border only)
   - 5xx → `destructive` (red)
3. Format JSON with `JSON.stringify(data, null, 2)`
4. Show duration in milliseconds
5. Truncate long URLs in collapsed state

#### tRPC Integration

```typescript
const { data: logs } = api.logs.list.useQuery(
  { serverId, limit: 50 },
  {
    refetchInterval: 3000, // Poll every 3 seconds
    refetchOnWindowFocus: true,
    enabled: !!serverId,
  }
);

const clearMutation = api.logs.clear.useMutation({
  onSuccess: () => {
    toast.success('Logs cleared');
    utils.logs.list.invalidate({ serverId });
  },
});
```

---

### 6.4 Tool Executor

**File:** `src/components/tool-executor.tsx`

**Purpose:** Execute MCP tools with JSON argument validation

#### shadcn Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- `Field`, `FieldLabel`, `FieldDescription`, `FieldError`
- `Textarea`
- `ButtonGroup`
- `Button`
- `Badge`
- `ScrollArea`

#### TanStack Form Schema

```typescript
const formSchema = z.object({
  arguments: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Must be valid JSON' }
  ),
});

const form = useForm({
  defaultValues: { arguments: '{}' },
  validators: { onSubmit: formSchema },
  onSubmit: async ({ value }) => {
    const args = JSON.parse(value.arguments);
    executeMutation.mutate({
      serverId,
      toolName: selectedTool,
      arguments: args,
    });
  },
});
```

#### Layout Pattern

```typescript
<Card>
  <CardHeader>
    <CardTitle>Execute Tool</CardTitle>
    <CardDescription>
      {selectedTool ? (
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{selectedTool}</Badge>
          {toolSchema && (
            <span className="text-xs text-muted-foreground">
              {Object.keys(toolSchema.properties || {}).length} parameters
            </span>
          )}
        </div>
      ) : (
        'Select a tool to execute'
      )}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <div className="space-y-4">
        <form.Field name="arguments" children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Arguments (JSON)</FieldLabel>
              <FieldDescription>
                Enter tool arguments as valid JSON
              </FieldDescription>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="font-mono text-sm"
                rows={8}
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }} />

        <ButtonGroup>
          <Button type="submit" disabled={executeMutation.isPending}>
            {executeMutation.isPending && <Spinner className="mr-2" />}
            Execute
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
        </ButtonGroup>

        {result && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Result</h4>
            <ScrollArea className="h-[300px]">
              <pre className="bg-muted p-4 rounded-md text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </form>
  </CardContent>
</Card>
```

#### Key Features
- ✅ JSON validation before execution
- ✅ Textarea with monospace font
- ✅ Real-time validation feedback
- ✅ Reset button to clear form
- ✅ Loading state during execution
- ✅ Result display with formatted JSON
- ✅ Tool schema info display

#### Implementation Notes
1. Use `Textarea` with `font-mono` for JSON input
2. Validate JSON syntax with Zod refine
3. Show tool name and parameter count in header
4. Display execution result in scrollable area
5. Clear result when switching tools
6. Disable execute button during pending state

#### tRPC Integration

```typescript
const executeMutation = api.server.request.useMutation({
  onSuccess: (data) => {
    setResult(data);
    toast.success('Tool executed successfully');
    utils.logs.list.invalidate({ serverId });
  },
  onError: (error) => {
    toast.error(error.message || 'Execution failed');
  },
});
```

---

### 6.5 Main Playground Interface

**File:** `src/components/playground.tsx`

**Purpose:** Main interface for interacting with MCP servers

#### shadcn Components Used
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Item`, `ItemContent`, `ItemTitle`, `ItemDescription`
- `ItemGroup`, `ItemSeparator`
- `ButtonGroup`
- `Badge`
- `ScrollArea`
- `Empty`
- `Spinner`

#### State Management

```typescript
const [selectedServer, setSelectedServer] = useState<string>();
const [selectedTool, setSelectedTool] = useState<string>();
const [selectedTab, setSelectedTab] = useState<'tools' | 'resources' | 'prompts'>('tools');

const { data: servers } = api.server.list.useQuery();

const { data: tools, isLoading: toolsLoading } = api.server.listTools.useQuery(
  { serverId: selectedServer! },
  { enabled: !!selectedServer }
);

const { data: resources } = api.server.listResources.useQuery(
  { serverId: selectedServer! },
  { enabled: !!selectedServer }
);

const { data: prompts } = api.server.listPrompts.useQuery(
  { serverId: selectedServer! },
  { enabled: !!selectedServer }
);
```

#### Layout Pattern

```typescript
<div className="space-y-6">
  {/* Server Selection */}
  <Card>
    <CardHeader>
      <CardTitle>Server</CardTitle>
    </CardHeader>
    <CardContent>
      <Select value={selectedServer} onValueChange={setSelectedServer}>
        <SelectTrigger>
          <SelectValue placeholder="Select a server" />
        </SelectTrigger>
        <SelectContent>
          {servers?.map((server) => (
            <SelectItem key={server.id} value={server.id}>
              {server.serverName || server.serverUrl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CardContent>
  </Card>

  {selectedServer && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Tools/Resources/Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="w-full">
              <TabsTrigger value="tools" className="flex-1">
                Tools
                {tools?.length && (
                  <Badge variant="secondary" className="ml-2">
                    {tools.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1">
                Resources
                {resources?.length && (
                  <Badge variant="secondary" className="ml-2">
                    {resources.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="prompts" className="flex-1">
                Prompts
                {prompts?.length && (
                  <Badge variant="secondary" className="ml-2">
                    {prompts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tools Tab */}
            <TabsContent value="tools">
              {toolsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : tools?.length === 0 ? (
                <Empty
                  title="No tools available"
                  description="This server does not expose any tools"
                />
              ) : (
                <ScrollArea className="h-[400px]">
                  <ItemGroup>
                    {tools?.map((tool, index) => (
                      <>
                        <Item
                          key={tool.name}
                          onClick={() => setSelectedTool(tool.name)}
                          className={selectedTool === tool.name ? 'bg-accent' : ''}
                        >
                          <ItemContent>
                            <ItemTitle>{tool.name}</ItemTitle>
                            <ItemDescription>{tool.description}</ItemDescription>
                          </ItemContent>
                        </Item>
                        {index !== tools.length - 1 && <ItemSeparator />}
                      </>
                    ))}
                  </ItemGroup>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              {/* Similar structure to tools */}
            </TabsContent>

            {/* Prompts Tab */}
            <TabsContent value="prompts">
              {/* Similar structure to tools */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Right: Executor */}
      <div>
        {selectedTab === 'tools' && selectedTool && (
          <ToolExecutor
            serverId={selectedServer}
            toolName={selectedTool}
          />
        )}
        {/* Add ResourceViewer and PromptExecutor components similarly */}
      </div>
    </div>
  )}
</div>
```

#### Key Features
- ✅ Server selection dropdown
- ✅ Tabs for Tools/Resources/Prompts
- ✅ Count badges on tabs
- ✅ Clickable list items with active state
- ✅ Loading states
- ✅ Empty states
- ✅ Nested executor components

#### Implementation Notes
1. Clear selected tool/resource/prompt when changing tabs
2. Clear all selections when changing servers
3. Show loading spinner while fetching capabilities
4. Highlight selected item with `bg-accent`
5. Use `Item` components for consistent list display
6. Show count badges on tabs
7. Lazy load executor components

---

### 6.6 Playground Notifications

**File:** `src/components/playground-notifications.tsx`

**Purpose:** Handle OAuth callback query params and show toast notifications

#### Implementation

```typescript
'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'OAuth authorization failed',
  token_exchange_failed: 'Failed to exchange authorization code',
  invalid_state: 'Invalid OAuth state - possible CSRF attack',
  server_not_found: 'Server not found',
  unauthorized: 'Unauthorized access',
};

export function PlaygroundNotifications() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'connected') {
      toast.success('Successfully connected to server!');
    }

    const errorCode = params.get('error');
    if (errorCode) {
      toast.error(ERROR_MESSAGES[errorCode] || 'An error occurred');
    }

    // Clean up URL after showing notifications
    if (params.get('success') || params.get('error')) {
      window.history.replaceState({}, '', '/playground');
    }
  }, []);

  return null;
}
```

#### Key Features
- ✅ Detects OAuth callback success
- ✅ Shows error messages from query params
- ✅ Cleans up URL after notification
- ✅ No UI rendered

#### Implementation Notes
1. Component only runs effects, returns null
2. Check for `?success=connected` and `?error=<code>`
3. Use predefined error messages for better UX
4. Clean URL with `replaceState` to avoid showing params
5. Mount once in Playground page

---

## Page Specifications

### 7.1 Playground Page

**File:** `src/app/(authenticated)/playground/page.tsx`

**Purpose:** Main authenticated playground interface

#### Full Implementation

```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { ServerConnection } from '@/components/server-connection';
import { ServerList } from '@/components/server-list';
import { Playground } from '@/components/playground';
import { RequestLogs } from '@/components/request-logs';
import { PlaygroundNotifications } from '@/components/playground-notifications';

export default async function PlaygroundPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header with user info and sign out */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">MCP Playground</h1>
            <p className="text-muted-foreground">
              Connect and test Model Context Protocol servers
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/auth/signout">Sign Out</a>
            </Button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Server management */}
          <div className="space-y-6">
            <ServerConnection />
            <ServerList />
          </div>

          {/* Right main area - Playground and logs */}
          <div className="lg:col-span-2 space-y-6">
            <PlaygroundNotifications />
            <Playground />
            <RequestLogs />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Key Features
- ✅ Server-side session check
- ✅ Redirect to home if not authenticated
- ✅ User email display
- ✅ Sign out button
- ✅ Responsive grid layout
- ✅ Component composition

---

### 7.2 Landing Page

**File:** `src/app/page.tsx`

**Purpose:** Public landing page with authentication

#### Full Implementation

```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GithubLight } from '@/components/ui/svgs/githubLight';
import { GithubDark } from '@/components/ui/svgs/githubDark';
import { MailIcon } from 'lucide-react';

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect('/playground');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">MCP Playground</h1>
          <p className="text-muted-foreground">
            Test and explore Model Context Protocol servers
          </p>
        </div>

        {/* Sign in Card */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Button asChild className="w-full" size="lg">
              <a href="/api/auth/signin/github">
                <GithubDark className="size-5 dark:hidden" />
                <GithubLight className="size-5 hidden dark:block" />
                Sign in with GitHub
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <a href="/api/auth/signin/email">
                <MailIcon className="size-5" />
                Sign in with Email
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Footer text */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
```

#### Key Features
- ✅ Server-side session check
- ✅ Redirect to playground if authenticated
- ✅ GitHub OAuth button with icon
- ✅ Magic Link email button with icon
- ✅ Centered card layout
- ✅ Gradient background
- ✅ Responsive design

---

### 7.3 Create Theme Provider

**File:** `src/components/theme-provider.tsx`

**Purpose:** Wrapper for next-themes

#### Implementation

```typescript
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

---

### 7.4 Update Root Layout

**File:** `src/app/layout.tsx`

**Purpose:** Add ThemeProvider and Sonner Toaster to root layout

#### Changes Needed

```typescript
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            {children}
            <Toaster />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### Key Changes
- ✅ Add `suppressHydrationWarning` to `<html>` tag
- ✅ Wrap with `<ThemeProvider>` for dark mode support
- ✅ Add `<Toaster />` for toast notifications
- ✅ Configure theme with `attribute="class"` and `defaultTheme="system"`

---

## Design Principles

### Visual Aesthetic
Inspired by Vercel, Resend, and Linear - clean, minimal, and focused.

**Typography**
- Use Geist font family (already configured)
- Font weights: `font-normal`, `font-medium`, `font-semibold` (avoid `font-bold` except for emphasis)
- Text hierarchy: Use size and color (not just weight) for hierarchy
- Tracking: Use `tracking-tight` for headlines

**Colors**
- Monochrome-first approach
- Use semantic colors sparingly (success, error, warning)
- Status indicators: Use subtle badges with appropriate variants
- Backgrounds: Subtle gradients (`from-background to-muted/20`)

**Spacing**
- Consistent spacing scale: `gap-3`, `gap-4`, `gap-6`, `gap-8`
- Section spacing: `space-y-6` or `space-y-8` for major sections
- Card padding: Default card padding (don't override unless needed)
- Whitespace: Embrace empty space - don't crowd elements

**Components**
- Cards: Subtle shadows and borders (shadcn defaults)
- Buttons: Ghost and outline variants over filled when possible
- Lists: Use Item components for consistent design
- Icons: `size-4` or `size-5` for inline icons
- Badges: Small, subtle, single color

**Layout**
- Responsive grid: Mobile-first with breakpoints
- Max widths: Use `max-w-md`, `max-w-lg`, etc. for centering
- Container: Use `container mx-auto` for page layouts

**Interactions**
- Subtle hover states (default shadcn behavior)
- Loading states: Spinner icons, disabled buttons
- Transitions: Keep them subtle and fast
- Focus states: Clear keyboard navigation indicators

### UI Component Guidelines

**When to use each component:**
- `Item` components: All list displays (servers, tools, resources)
- `InputGroup`: Inputs with icons or action buttons
- `ButtonGroup`: Related actions (e.g., user menu, toolbar)
- `Field` components: Form layouts with labels and errors
- `Empty`: No data states with title and description
- `Badge`: Status indicators, counts, tags
- `Spinner`: Loading states (button icons, full page)

**SVG Icons (svgl):**
- Use svgl components for brand logos (GitHub, etc.)
- Install via: `pnpm dlx shadcn@latest add @svgl/<icon-name>`
- Theme-aware icons: Use both Light and Dark variants with Tailwind classes
  - `GithubLight` = dark fill (#1B1F23) → use ON light backgrounds
  - `GithubDark` = white fill (#ffff) → use ON dark backgrounds
- Pattern: `<IconDark className="dark:hidden" />` + `<IconLight className="hidden dark:block" />`
- For simple icons, use lucide-react instead (MailIcon, GlobeIcon, etc.)

---

## Patterns & Best Practices

### TanStack Form Pattern

**Standard form structure:**

```typescript
const form = useForm({
  defaultValues: { /* ... */ },
  validators: { onSubmit: zodSchema },
  onSubmit: async ({ value }) => { /* ... */ },
});

return (
  <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
    <form.Field name="fieldName" children={(field) => {
      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
      return (
        <Field data-invalid={isInvalid}>
          <FieldLabel htmlFor={field.name}>Label</FieldLabel>
          <FieldDescription>Helper text</FieldDescription>
          <Input
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            aria-invalid={isInvalid}
          />
          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
      );
    }} />
    <Button type="submit">Submit</Button>
  </form>
);
```

### Item Component Pattern

**For list displays:**

```typescript
<ItemGroup>
  {items.map((item, index) => (
    <>
      <Item key={item.id}>
        <ItemContent>
          <ItemTitle>{item.title}</ItemTitle>
          <ItemDescription>{item.description}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button>Action</Button>
        </ItemActions>
      </Item>
      {index !== items.length - 1 && <ItemSeparator />}
    </>
  ))}
</ItemGroup>
```

### InputGroup Pattern

**For inputs with icons or buttons:**

```typescript
<InputGroup>
  <InputGroupInput placeholder="https://..." />
  <InputGroupAddon>
    <GlobeIcon />
  </InputGroupAddon>
</InputGroup>
```

### ButtonGroup Pattern

**For related actions:**

```typescript
<ButtonGroup>
  <Button>Primary Action</Button>
  <Button variant="outline">Secondary Action</Button>
</ButtonGroup>
```

### tRPC Mutation Pattern

**Standard mutation with toast feedback:**

```typescript
const mutation = api.endpoint.mutate.useMutation({
  onSuccess: (data) => {
    toast.success('Action successful!');
    utils.relatedQuery.invalidate();
  },
  onError: (error) => {
    toast.error(error.message || 'Action failed');
  },
});
```

### Polling Pattern

**For auto-refresh:**

```typescript
const { data } = api.endpoint.useQuery(
  { id },
  {
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    enabled: !!id,
  }
);
```

---

## Implementation Order

### Phase 1: Setup
1. ✅ Install shadcn components: `pnpm dlx shadcn@latest add button input label form card badge select alert-dialog accordion sonner spinner scroll-area separator tabs item input-group button-group field empty`
2. ✅ Install TanStack Form: `pnpm add @tanstack/react-form` (Zod v4 is already installed; native Standard Schema support, no adapter needed)
3. ✅ Create `ThemeProvider` component
4. ✅ Add `<ThemeProvider>` and `<Toaster />` to root layout
5. ✅ Create `spec/PHASE_6_7_FRONTEND.md` (this document)

### Phase 2: Notifications
1. ✅ Create `PlaygroundNotifications` component
2. ✅ Test with mock query params

### Phase 3: Forms (TanStack Form)
1. ✅ Create `ServerConnection` form with InputGroup
2. ✅ Create `ToolExecutor` form with JSON validation
3. ✅ Test form validation and submission

### Phase 4: Display Components
1. ✅ Create `ServerList` with Item components
2. ✅ Create `RequestLogs` with Accordion and polling
3. ✅ Test auto-refresh and delete confirmations

### Phase 5: Main Interface
1. ✅ Create `Playground` component with Tabs
2. ✅ Integrate nested components
3. ✅ Test server selection and capability listing

### Phase 6: Pages
1. ✅ Create authenticated Playground page
2. ✅ Update Landing page
3. ✅ Test authentication flows

### Phase 7: Testing & Polish
1. ✅ Run linter and fix errors
2. ✅ Run typecheck
3. ✅ Test responsive design
4. ✅ Test all user flows
5. ✅ Update main `spec/IMPLEMENTATION.md`

---

## TODO Checklist

### Setup
- [ ] Install shadcn components (button, input, label, form, card, badge, select, alert-dialog, accordion, sonner, spinner, scroll-area, separator, tabs, item, input-group, button-group, field, empty)
- [ ] Install TanStack Form: `pnpm add @tanstack/react-form` (Zod v4 already installed, native support)
- [ ] Create `src/components/theme-provider.tsx` - next-themes wrapper
- [ ] Update `src/app/layout.tsx` - add `<ThemeProvider>` and `<Toaster />`
- [ ] Install email SVG: `pnpm dlx shadcn@latest add @svgl/email` (if available)

### Components
- [ ] `src/components/theme-provider.tsx` - next-themes wrapper
- [ ] `src/components/playground-notifications.tsx` - OAuth toast handler
- [ ] `src/components/server-connection.tsx` - TanStack Form + InputGroup
- [ ] `src/components/server-list.tsx` - Item components + AlertDialog
- [ ] `src/components/request-logs.tsx` - Accordion + polling + badges
- [ ] `src/components/tool-executor.tsx` - TanStack Form + JSON validation
- [ ] `src/components/playground.tsx` - Tabs + Select + nested components

### Pages
- [ ] `src/app/(authenticated)/playground/page.tsx` - Main playground
- [ ] `src/app/page.tsx` - Landing page with GitHub SVG icons

### Quality Checks
- [ ] Run formatter: `pnpm run format`
- [ ] Run linter: `pnpm run lint`
- [ ] Run typecheck: `pnpm run typecheck`
- [ ] Fix any errors

### Testing
- [ ] Test ServerConnection form with valid/invalid URLs
- [ ] Test OAuth flow (connect → redirect → callback → success)
- [ ] Test server list display and delete confirmation
- [ ] Test log polling (auto-refresh every 3s)
- [ ] Test tool execution with JSON validation
- [ ] Test responsive design (mobile + desktop)
- [ ] Test empty states (no servers, no logs, no tools)
- [ ] Test loading states (spinners, disabled buttons)
- [ ] Test error states (toast notifications)

### Documentation
- [ ] Update `spec/IMPLEMENTATION.md` - Mark Phase 6 & 7 complete
- [ ] Add screenshots/examples (optional)

---

## Testing Strategy

### Unit Testing Focus
1. **Form Validation**
   - Test Zod schemas with valid/invalid inputs
   - Test form submission with mock mutations
   - Test field-level validation errors

2. **Component Rendering**
   - Test empty states
   - Test loading states
   - Test error states
   - Test populated states

### Integration Testing Focus
1. **OAuth Flow**
   - Connect to auth-required server
   - Complete authorization
   - Verify callback handling
   - Check toast notifications

2. **Server Management**
   - Add server
   - List servers
   - Delete server with confirmation
   - Switch between servers

3. **Tool Execution**
   - Select tool
   - Execute with valid args
   - Handle execution errors
   - View results

4. **Log Polling**
   - Verify 3-second refresh
   - Expand/collapse log entries
   - Clear logs
   - Check status colors

### Manual Testing Checklist

#### Non-Auth Server
1. [ ] Add server with valid URL
2. [ ] Verify connection succeeds
3. [ ] List tools/resources/prompts
4. [ ] Execute a tool
5. [ ] View logs in real-time
6. [ ] Delete server

#### Auth Server
1. [ ] Add auth-required server
2. [ ] Get redirected to OAuth page
3. [ ] Complete authorization
4. [ ] Get redirected back with success toast
5. [ ] Verify connection status
6. [ ] Execute authenticated requests
7. [ ] View logs with auth headers

#### Edge Cases
1. [ ] Add server with invalid URL
2. [ ] Cancel OAuth flow
3. [ ] Token expires during use
4. [ ] Network timeout
5. [ ] Server goes offline
6. [ ] Invalid JSON in tool args
7. [ ] Empty server list
8. [ ] Empty logs list

#### Responsive Design
1. [ ] Test on mobile (320px width)
2. [ ] Test on tablet (768px width)
3. [ ] Test on desktop (1280px width)
4. [ ] Verify grid layout adapts
5. [ ] Check scrollable areas
6. [ ] Test touch interactions

---

## Success Criteria

### Functionality
- ✅ All forms use TanStack Form with Zod validation
- ✅ All UI uses shadcn/ui v4 components (Item, InputGroup, ButtonGroup, Field, etc.)
- ✅ Type-safe tRPC hooks throughout
- ✅ Proper loading states with Spinner
- ✅ Error handling with toast notifications
- ✅ OAuth flow works end-to-end
- ✅ Logs auto-refresh every 3 seconds
- ✅ Empty states for no data
- ✅ Confirmation dialogs for destructive actions

### User Experience
- ✅ Responsive design (mobile + desktop)
- ✅ Clean, consistent UI matching shadcn aesthetics
- ✅ Smooth transitions and animations
- ✅ Intuitive navigation
- ✅ Clear feedback for all actions
- ✅ Accessible components (ARIA labels, keyboard navigation)

### Code Quality
- ✅ No linting errors
- ✅ No type errors
- ✅ Consistent code style
- ✅ Well-organized component structure
- ✅ Reusable patterns
- ✅ Clear naming conventions

---

## Notes

### Design Decisions
- **Item components** for all list displays (cleaner than custom divs)
- **InputGroup** for inputs with icons/buttons (better UX)
- **ButtonGroup** for related actions (consistent spacing)
- **TanStack Form** over React Hook Form (better type inference)
- **Polling** instead of WebSocket (simpler, Vercel-friendly)
- **shadcn/ui v4** for latest components (Item, InputGroup, Field)

### Best Practices
- All forms must validate with Zod before submission
- All mutations must invalidate relevant queries
- All destructive actions need confirmation dialogs
- Toasts for all user feedback (success, error, info)
- Loading states for all async operations
- Empty states for all lists/collections
- Aria labels for accessibility
- Keyboard navigation support

### Common Pitfalls to Avoid
- ❌ Don't forget to enable tRPC queries conditionally (use `enabled` option)
- ❌ Don't forget to invalidate queries after mutations
- ❌ Don't forget to add `key` prop to list items
- ❌ Don't forget to handle loading/error states
- ❌ Don't forget to clean up URL params after OAuth callback
- ❌ Don't forget to show spinners during async operations
- ❌ Don't forget Item separators between list items
- ❌ Don't forget to validate JSON before parsing

---

**Last Updated:** October 26, 2025
**Status:** ✅ Spec Complete - Ready for Implementation
**Next Step:** Install shadcn components and TanStack Form dependencies

---

## File Structure

```
spec/
└── PHASE_6_7_FRONTEND.md          ← THIS FILE

src/
├── components/
│   ├── ui/                         (existing shadcn components)
│   │   └── svgs/
│   │       ├── githubLight.tsx     ✅ (existing)
│   │       └── githubDark.tsx      ✅ (existing)
│   ├── theme-provider.tsx          ← NEW (next-themes wrapper)
│   ├── server-connection.tsx       ← NEW (TanStack Form)
│   ├── server-list.tsx             ← NEW (Item components)
│   ├── request-logs.tsx            ← NEW (Accordion + polling)
│   ├── tool-executor.tsx           ← NEW (TanStack Form)
│   ├── playground.tsx              ← NEW (Tabs + Select)
│   └── playground-notifications.tsx← NEW (toast handler)
│
└── app/
    ├── layout.tsx                  ← UPDATE (ThemeProvider + Toaster)
    ├── page.tsx                    ← UPDATE (landing + GitHub icons)
    └── (authenticated)/
        └── playground/
            └── page.tsx            ← NEW (main playground)
```

---

**End of Phase 6 & 7 Frontend Specification**
