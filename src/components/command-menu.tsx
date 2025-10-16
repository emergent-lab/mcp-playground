"use client";

import { Moon, Server, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "./ui/kbd";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandInput
        placeholder="Type a command or search..."
        rightElement={
          <Kbd className="p-1.5 font-medium font-mono text-muted-foreground text-xs">
            esc
          </Kbd>
        }
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => {
              router.push("/servers");
              setOpen(false);
            }}
          >
            <Server />
            <span>Servers</span>
            <Kbd className="ml-auto border">S</Kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              router.push("/playground");
              setOpen(false);
            }}
          >
            <Sun />
            <span>Playground</span>
            <Kbd className="ml-auto border">P</Kbd>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            <Moon />
            <span>Toggle Theme</span>
            <Kbd className="ml-auto border">M</Kbd>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
