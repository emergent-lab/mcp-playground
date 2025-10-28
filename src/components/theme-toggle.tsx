"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// Animation constants
const DARK_MODE_CLIP_Y = 10;
const DARK_MODE_CLIP_X = -12;
const DARK_MODE_RADIUS = 10;
const LIGHT_MODE_RADIUS = 8;
const DARK_MODE_ROTATION = -100;
const DARK_MODE_SCALE = 0.5;

type ThemeToggleProps = {
  className?: string;
  isHovered?: boolean;
};

export const ThemeToggle = ({
  className = "",
  isHovered = false,
}: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={cn(
          "cursor-pointer rounded-full transition-all duration-300",
          className
        )}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="currentColor"
          strokeLinecap="round"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Empty SVG to prevent flash */}
        </svg>
      </button>
    );
  }

  const isDark = theme === "dark";

  const handleClick = () => {
    setHasInteracted(true);
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={cn(
        "cursor-pointer rounded-full transition-all duration-300 active:scale-95",
        className
      )}
      onClick={handleClick}
      type="button"
    >
      <motion.svg
        animate={{
          rotate: isHovered ? (isDark ? -15 : 15) : 0,
        }}
        aria-hidden="true"
        fill="currentColor"
        strokeLinecap="round"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <clipPath id="skiper-btn-2">
          <motion.path
            animate={{
              y: isDark ? DARK_MODE_CLIP_Y : 0,
              x: isDark ? DARK_MODE_CLIP_X : 0,
            }}
            d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
            transition={
              hasInteracted
                ? { ease: "easeInOut", duration: 0.35 }
                : { duration: 0 }
            }
          />
        </clipPath>
        <g clipPath="url(#skiper-btn-2)">
          <motion.circle
            animate={{ r: isDark ? DARK_MODE_RADIUS : LIGHT_MODE_RADIUS }}
            cx="16"
            cy="16"
            transition={
              hasInteracted
                ? { ease: "easeInOut", duration: 0.35 }
                : { duration: 0 }
            }
          />
          <motion.g
            animate={{
              rotate: isDark ? DARK_MODE_ROTATION : 0,
              scale: isDark ? DARK_MODE_SCALE : 1,
              opacity: isDark ? 0 : 1,
            }}
            stroke="currentColor"
            strokeWidth="1.5"
            transition={
              hasInteracted
                ? { ease: "easeInOut", duration: 0.35 }
                : { duration: 0 }
            }
          >
            <path d="M16 5.5v-4" />
            <path d="M16 30.5v-4" />
            <path d="M1.5 16h4" />
            <path d="M26.5 16h4" />
            <path d="m23.4 8.6 2.8-2.8" />
            <path d="m5.7 26.3 2.9-2.9" />
            <path d="m5.8 5.8 2.8 2.8" />
            <path d="m23.4 23.4 2.9 2.9" />
          </motion.g>
        </g>
      </motion.svg>
    </button>
  );
};
