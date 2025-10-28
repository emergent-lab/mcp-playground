"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export function ServerSidebarMenu() {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const params = useParams();
  const activeServerId = params?.serverId as string | undefined;

  const { data: servers, isLoading } = useQuery(api.server.list.queryOptions());

  const deleteMutation = useMutation(
    api.server.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Server deleted");
        queryClient.invalidateQueries({ queryKey: api.server.list.queryKey() });
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
      <div className="px-2 py-8">
        <Empty>
          <EmptyTitle className="text-sm">No servers</EmptyTitle>
          <EmptyDescription className="text-xs">
            Add your first server to get started
          </EmptyDescription>
        </Empty>
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
                <TrashIcon />
                <span className="sr-only">Delete</span>
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
                  onClick={() =>
                    deleteMutation.mutate({
                      serverId: server.serverId,
                    })
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
