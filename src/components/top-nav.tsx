"use client";

import { usePathname } from "next/navigation";
import { NavItem } from "@/components/nav-item";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

export function TopNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Servers",
      href: "/servers",
    },
    {
      name: "Playground",
      href: "/playground",
    },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex justify-center gap-3 px-4 pt-4">
      <nav className="flex h-14 max-w-3xl flex-1 items-center gap-6 rounded-full border border-border/40 bg-primary-foreground/60 px-6 backdrop-blur-xl">
        <Wordmark />
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavItem
              href={item.href}
              isActive={pathname === item.href}
              key={item.name}
              name={item.name}
            />
          ))}
        </div>
      </nav>
      <div className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border/40 bg-primary-foreground/60 backdrop-blur-xl">
        <ThemeToggle className="size-10 p-2" />
      </div>
    </header>
  );
}
