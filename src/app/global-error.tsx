"use client";

// biome-ignore lint/performance/noNamespaceImport: Sentry is a namespace import
import * as Sentry from "@sentry/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { useEffect } from "react";
import "./globals.css";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangleIcon className="text-destructive" />
                </EmptyMedia>
                <EmptyTitle className="font-medium text-foreground">
                  Something went wrong
                </EmptyTitle>
                <EmptyDescription className="text-muted-foreground">
                  An unexpected error occurred. Our team has been notified and
                  is working to fix the issue.
                  {error.digest ? (
                    <span className="mt-2 block font-mono text-xs">
                      Error ID: {error.digest}
                    </span>
                  ) : null}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                >
                  <RefreshCwIcon />
                  Reload Page
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
