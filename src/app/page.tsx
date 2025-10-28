"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ModelContextProtocol } from "@/components/ui/svgs/model-context-protocol";
import { useAddServerDialog } from "@/contexts/add-server-dialog-context";

export default function Home() {
  const { setOpen } = useAddServerDialog();

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ModelContextProtocol />
          </EmptyMedia>
          <EmptyTitle className="font-medium text-foreground">
            No Server Selected
          </EmptyTitle>
          <EmptyDescription className="text-muted-foreground">
            Select a server from the sidebar or add a new one to get started
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => setOpen(true)} variant="secondary">
            <PlusIcon />
            Add Server
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
