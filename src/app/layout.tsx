import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import { CommandMenu } from "@/components/command-menu";
import { KeyboardShortcutsHandler } from "@/components/keyboard-shortcuts-handler";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNav } from "@/components/top-nav";
import { BreakpointIndicator } from "@/components/ui/breakpoint-indicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const foundryPlek = localFont({
  src: "./fonts/foundry-plek.woff2",
  variable: "--font-plek",
});

export const metadata: Metadata = {
  title: "MCP Playground",
  description: "MCP Playground",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${foundryPlek.variable} font-sans antialiased`}
      >
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <KeyboardShortcutsHandler />
          <CommandMenu />
          <TopNav />
          <BreakpointIndicator className="fixed bottom-0 left-0" />
          <main className="min-h-screen">
            <div className="mx-auto min-h-screen w-full max-w-6xl py-32">
              {children}
            </div>
          </main>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
