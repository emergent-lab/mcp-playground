import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <TopNav />
          <BreakpointIndicator className="fixed bottom-0 left-0" />

          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
