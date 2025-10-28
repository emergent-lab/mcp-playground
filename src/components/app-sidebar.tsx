"use client";

import { PlusIcon } from "lucide-react";
import { AddServerDialog } from "@/components/add-server-dialog";
import { ServerSidebarMenu } from "@/components/server-sidebar-menu";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAddServerDialog } from "@/contexts/add-server-dialog-context";

export function AppSidebar() {
  const { open, setOpen } = useAddServerDialog();

  return (
    <>
      <Sidebar variant="sidebar">
        <SidebarHeader className="p-4">
          <SiteHeader />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel>Servers</SidebarGroupLabel>
              <Tooltip delayDuration={1500}>
                <TooltipTrigger asChild>
                  <Button
                    className="size-6"
                    onClick={() => setOpen(true)}
                    size="icon"
                    variant="ghost"
                  >
                    <PlusIcon className="size-4" />
                    <span className="sr-only">Add Server</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="px-1.5 py-1.5 text-xs" side="right">
                  <Kbd className="h-3.5 min-w-3.5 px-0.5 text-xs">N</Kbd>
                </TooltipContent>
              </Tooltip>
            </div>
            <SidebarGroupContent>
              <ServerSidebarMenu />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <AddServerDialog onOpenChange={setOpen} open={open} />
    </>
  );
}
