"use client";

import { motion } from "framer-motion";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

type AnimatedSidebarTriggerProps = {
  className?: string;
};

export function AnimatedSidebarTrigger({
  className,
}: AnimatedSidebarTriggerProps) {
  const { open, toggleSidebar } = useSidebar();

  return (
    <Tooltip delayDuration={1500}>
      <TooltipTrigger asChild>
        <button
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          className={cn(
            "flex size-9 cursor-pointer items-center justify-center",
            className,
          )}
          onClick={toggleSidebar}
          type="button"
        >
          <div className="relative grid cursor-pointer items-center justify-center">
            <svg
              fill="none"
              height="16"
              viewBox="0 0 16 16"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M0.32698 2.63803C0 3.27976 0 4.11984 0 5.8V10.2C0 11.8802 0 12.7202 0.32698 13.362C0.614601 13.9265 1.07354 14.3854 1.63803 14.673C2.27976 15 3.11984 15 4.8 15H11.2C12.8802 15 13.7202 15 14.362 14.673C14.9265 14.3854 15.3854 13.9265 15.673 13.362C16 12.7202 16 11.8802 16 10.2V5.8C16 4.11984 16 3.27976 15.673 2.63803C15.3854 2.07354 14.9265 1.6146 14.362 1.32698C13.7202 1 12.8802 1 11.2 1H4.8C3.11984 1 2.27976 1 1.63803 1.32698C1.07354 1.6146 0.614601 2.07354 0.32698 2.63803Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
            <motion.div
              animate={{ width: open ? "4.5px" : "1.5px" }}
              className="absolute left-[3px] h-[10px] w-[1.5px] rounded-[1px] bg-background"
              initial={{ width: open ? "4.5px" : "1.5px" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent className="px-1.5 py-0.5 text-xs" side="bottom">
        <Kbd className="h-3.5 min-w-3.5 px-0.5 text-xs">B</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
