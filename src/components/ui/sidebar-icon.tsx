"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";

const SIDEBAR_ICON_WIDTH_EXPANDED = "4.5px";
const SIDEBAR_ICON_WIDTH_COLLAPSED = "1.5px";

const SideBarIcon = ({ className }: { className?: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = () => {
    setIsHovered((prev) => !prev);
  };

  return (
    <button
      className={cn(
        "flex size-full cursor-pointer items-center justify-center border-none bg-transparent p-0",
        className
      )}
      onClick={handleToggle}
      type="button"
    >
      <div className="relative grid cursor-pointer items-center justify-center">
        <svg
          aria-hidden="true"
          className={className}
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Sidebar indicator</title>
          <path
            clipRule="evenodd"
            d="M0.32698 2.63803C0 3.27976 0 4.11984 0 5.8V10.2C0 11.8802 0 12.7202 0.32698 13.362C0.614601 13.9265 1.07354 14.3854 1.63803 14.673C2.27976 15 3.11984 15 4.8 15H11.2C12.8802 15 13.7202 15 14.362 14.673C14.9265 14.3854 15.3854 13.9265 15.673 13.362C16 12.7202 16 11.8802 16 10.2V5.8C16 4.11984 16 3.27976 15.673 2.63803C15.3854 2.07354 14.9265 1.6146 14.362 1.32698C13.7202 1 12.8802 1 11.2 1H4.8C3.11984 1 2.27976 1 1.63803 1.32698C1.07354 1.6146 0.614601 2.07354 0.32698 2.63803Z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </svg>
        <motion.div
          animate={{
            width: isHovered
              ? SIDEBAR_ICON_WIDTH_EXPANDED
              : SIDEBAR_ICON_WIDTH_COLLAPSED,
          }}
          className="absolute left-[3px] h-[10px] w-[1.5px] rounded-[1px] bg-background"
        />
      </div>
    </button>
  );
};

export { SideBarIcon };
