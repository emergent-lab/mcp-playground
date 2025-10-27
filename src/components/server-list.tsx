"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { Fragment } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTRPC } from "@/lib/trpc/client";

export function ServerList() {
  const api = useTRPC();
  const queryClient = useQueryClient();

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
      <Card>
        <CardHeader>
          <CardTitle>Connected Servers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Servers</CardTitle>
      </CardHeader>
      <CardContent>
        {!servers || servers.length === 0 ? (
          <Empty>
            <EmptyTitle>No servers connected</EmptyTitle>
            <EmptyDescription>
              Add your first MCP server to get started
            </EmptyDescription>
          </Empty>
        ) : (
          <ScrollArea className="h-[400px]">
            <ItemGroup>
              {servers.map((server, index) => (
                <Fragment key={server.id}>
                  <Item>
                    <ItemContent>
                      <ItemTitle>
                        {server.serverName || "Unnamed Server"}
                      </ItemTitle>
                      <ItemDescription className="flex items-center gap-2">
                        <span className="truncate">{server.serverUrl}</span>
                        {server.requiresAuth && (
                          <Badge variant="outline">OAuth</Badge>
                        )}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon-sm" variant="ghost">
                            <TrashIcon className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Server?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove &quot;
                              {server.serverName || server.serverUrl}&quot; and
                              all associated logs. This action cannot be undone.
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
                    </ItemActions>
                  </Item>
                  {index !== servers.length - 1 && <ItemSeparator />}
                </Fragment>
              ))}
            </ItemGroup>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
