import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenuTrigger } from "@/components/command-menu-trigger";
import { KeyboardShortcutsHandler } from "@/components/keyboard-shortcuts-handler";
import { SignInDialog } from "@/components/sign-in-dialog";
import { ThemeDropdownMenu } from "@/components/theme-dropdown-menu";
import { ThemeProvider } from "@/components/theme-provider";
import { AnimatedSidebarTrigger } from "@/components/ui/animated-sidebar-trigger";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AddServerDialogProvider } from "@/contexts/add-server-dialog-context";
import { CommandMenuProvider } from "@/contexts/command-menu-context";
import { auth } from "@/lib/auth";
import { TRPCReactProvider } from "@/lib/trpc/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCP Playground",
  description: "Test and explore MCP servers",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <TRPCReactProvider>
            <AddServerDialogProvider>
              <CommandMenuProvider>
                <KeyboardShortcutsHandler />
                <SidebarProvider defaultOpen={defaultOpen}>
                  <AppSidebar />
                  <SidebarInset>
                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
                      <AnimatedSidebarTrigger />
                      <div className="flex flex-1 justify-center">
                        <CommandMenuTrigger />
                      </div>
                      <div className="flex items-center gap-1">
                        {session && !session.user.isAnonymous ? (
                          <Button asChild size="sm" variant="outline">
                            <a href="/api/auth/signout">Sign Out</a>
                          </Button>
                        ) : (
                          <SignInDialog />
                        )}
                        <ThemeDropdownMenu />
                      </div>
                    </header>
                    <main className="flex flex-1 flex-col gap-6 overflow-auto p-8">
                      {children}
                    </main>
                  </SidebarInset>
                </SidebarProvider>
                <Toaster />
              </CommandMenuProvider>
            </AddServerDialogProvider>
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
