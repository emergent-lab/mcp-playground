"use client";

import { CogIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "./ui/kbd";

type ThemeDropdownMenuProps = {
  side?: "top" | "right" | "bottom" | "left";
};

export function ThemeDropdownMenu({ side = "bottom" }: ThemeDropdownMenuProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full" size="icon-sm" variant="ghost">
          <CogIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side}>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleThemeToggle}
        >
          <div className="flex items-center gap-2">
            <ThemeToggle className="size-4 text-foreground transition-transform hover:scale-110" />
            <span>Toggle Theme</span> <Kbd className="border">M</Kbd>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
