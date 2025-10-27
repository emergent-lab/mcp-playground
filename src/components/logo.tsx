"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function Logo({ className, width = 200, height = 200 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn("animate-pulse bg-muted", className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      <Image
        alt="MCP Playground"
        className={cn(
          "object-cover transition-all duration-200",
          resolvedTheme === "dark" && "invert"
        )}
        fill
        priority
        src="/logo.svg"
        style={{ objectPosition: "center", scale: "1.5" }}
      />
    </div>
  );
}
