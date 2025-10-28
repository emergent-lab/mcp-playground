"use client";

import { CogIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { LogoutIcon } from "@/components/logout-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { authClient } from "@/lib/auth-client";

type SettingsDropdownMenuProps = {
  side?: "top" | "right" | "bottom" | "left";
  user?: {
    name: string;
    email: string;
  } | null;
};

export function SettingsDropdownMenu({
  side = "bottom",
  user,
}: SettingsDropdownMenuProps) {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full" size="icon-sm" variant="ghost">
          <CogIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        side={side}
      >
        {user && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-sm leading-none">{user.name}</p>
                <p className="text-muted-foreground text-xs leading-none">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleThemeToggle}
        >
          <ThemeToggle className="size-4" />
          <span>Toggle Theme</span>
          <Kbd className="border">M</Kbd>
        </DropdownMenuItem>
        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={handleSignOut}
            >
              <LogoutIcon />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
