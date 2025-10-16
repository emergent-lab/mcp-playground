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
    <header className="fixed top-0 right-0 left-0 z-50 w-full px-4 pt-6 sm:px-12">
      <div className="grid w-full grid-cols-3 items-center gap-4 px-4">
        <Wordmark />
        <nav className="flex h-14 items-center justify-center justify-self-center rounded-full border border-border/40 bg-primary-foreground/60 px-6 backdrop-blur-xl">
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
        <div className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center justify-self-end rounded-full border border-border/40 bg-primary-foreground/60 backdrop-blur-xl">
          <ThemeToggle className="size-10 p-2" />
        </div>
      </div>
    </header>
  );
}
