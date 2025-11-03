"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc/client";

const EXPLORE_SERVERS = [
  {
    name: "Grep",
    summary: "Search millions of GitHub repos via MCP for code snippets.",
    url: "https://mcp.grep.app",
  },
  {
    name: "Context7",
    summary: "Fetch current library docs and examples via MCP.",
    url: "https://mcp.context7.com/mcp",
  },
  {
    name: "Better Auth",
    summary: "Search Better Auth docs and chat with their AI.",
    url: "https://mcp.chonkie.ai/better-auth/better-auth-builder/mcp",
  },
];

export function ServerSidebarMenu() {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const activeServerId = params?.serverId as string | undefined;
  const [connectingUrl, setConnectingUrl] = useState<string | null>(null);

  const { data: servers, isLoading } = useQuery(api.server.list.queryOptions());

  const connectMutation = useMutation(
    api.server.connect.mutationOptions({
      onSuccess: (data) => {
        if (data.status === "needs_auth") {
          toast.info("Redirecting to authorization...");
          window.location.href = data.authUrl;
        } else {
          toast.success("Connected successfully!");
          queryClient.invalidateQueries({
            queryKey: api.server.list.queryKey(),
          });
          router.push(`/server/${data.serverId}`);
        }
        setConnectingUrl(null);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to connect");
        setConnectingUrl(null);
      },
    })
  );

  const handleAddServer = async (name: string, url: string) => {
    setConnectingUrl(url);

    try {
      // Check if user has a session, if not create anonymous session
      const { data: session } = await authClient.getSession();

      if (!session) {
        // Silently create anonymous session
        await authClient.signIn.anonymous();
      }

      // Now proceed with server connection
      const serverId = crypto.randomUUID();
      connectMutation.mutate({
        serverId,
        serverUrl: url,
        serverName: name,
      });
    } catch {
      toast.error("Failed to authenticate");
      setConnectingUrl(null);
    }
  };

  const deleteMutation = useMutation(
    api.server.delete.mutationOptions({
      onSuccess: (_data, variables) => {
        toast.success("Server deleted");

        // Invalidate all queries to clear any cached data for the deleted server
        queryClient.invalidateQueries();

        // If we just deleted the currently active server, redirect to home
        // Use replace() to remove the deleted server page from browser history
        if (activeServerId === variables.serverId) {
          router.replace("/");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete server");
      },
    })
  );

  if (isLoading) {
    return (
      <SidebarMenu>
        {Array.from({ length: 3 }, (_, i) => i).map((i) => (
          <SidebarMenuItem key={`skeleton-${i}`}>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8">
        <Empty>
          <EmptyTitle className="text-sm">No servers</EmptyTitle>
          <EmptyDescription className="text-xs">
            Add your first server to get started
          </EmptyDescription>
        </Empty>

        <section
          aria-labelledby="explore-servers-heading"
          className="flex flex-col gap-4"
        >
          <div className="space-y-1.5">
            <h2
              className="font-semibold text-muted-foreground text-xs uppercase tracking-wide"
              id="explore-servers-heading"
            >
              Explore Servers
            </h2>
            <p className="text-muted-foreground/70 text-xs leading-relaxed">
              Curated picks to help you get started quickly.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {EXPLORE_SERVERS.map((server) => {
              const isConnecting = connectingUrl === server.url;

              return (
                <li key={server.url}>
                  <Card className="gap-2 overflow-hidden border-border/50 bg-card/50 p-3.5 shadow-sm transition-all hover:border-border hover:bg-card hover:shadow-md">
                    <div className="flex items-center justify-between gap-2.5">
                      <h3 className="font-semibold text-sm tracking-tight">
                        {server.name}
                      </h3>
                      <Button
                        className="h-7 shrink-0 rounded-lg px-3 font-medium text-xs shadow-sm"
                        disabled={connectingUrl !== null}
                        onClick={() => handleAddServer(server.name, server.url)}
                        size="sm"
                        variant="secondary"
                      >
                        {isConnecting ? (
                          <span className="flex items-center gap-1.5">
                            <Spinner className="size-3" />
                            Adding
                          </span>
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                    <p className="text-muted-foreground/80 text-xs leading-snug">
                      {server.summary}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <SidebarMenu>
      {servers.map((server) => (
        <SidebarMenuItem key={server.id}>
          <SidebarMenuButton
            asChild
            isActive={activeServerId === server.serverId}
            size="lg"
          >
            <Link href={`/server/${server.serverId}`}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-sm">
                  {server.serverName || server.serverUrl}
                </span>
                {server.serverName && (
                  <span className="truncate text-muted-foreground text-xs">
                    {server.serverUrl}
                  </span>
                )}
              </div>
              {server.requiresAuth && (
                <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                  OAuth
                </span>
              )}
            </Link>
          </SidebarMenuButton>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <SidebarMenuAction showOnHover>
                <TrashIcon className="cursor-pointer" />
                <span className="sr-only cursor-pointer">Delete</span>
              </SidebarMenuAction>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Server?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove &quot;
                  {server.serverName || server.serverUrl}&quot; and all
                  associated logs. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate({
                      serverId: server.serverId,
                    })
                  }
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
