"use client";

import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

type LogoutIconProps = {
  className?: string;
};

export function LogoutIcon({ className }: LogoutIconProps) {
  const logoutAnimate = useAnimation();

  const handleLogoutAnimate = async () => {
    await logoutAnimate.start({
      x: [0, 3, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut",
      },
    });
  };

  return (
    <svg
      aria-hidden="true"
      className={cn("size-4", className)}
      fill="none"
      height="24"
      onMouseEnter={handleLogoutAnimate}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Sign out icon</title>
      <motion.g animate={logoutAnimate}>
        <path d="m10 17 5-5-5-5" />
        <path d="M15 12H3" />
      </motion.g>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}
