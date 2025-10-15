"use client";

import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // You can log the error to an error reporting service here
  // e.g., Sentry, LogRocket, etc.
  const _ = error; // Acknowledge error param

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border/40 bg-primary-foreground/60 p-12 backdrop-blur-xl">
        <Wordmark />
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-plek font-semibold text-6xl">Error</h1>
          <h2 className="font-medium text-xl">Something went wrong</h2>
          <p className="text-center text-muted-foreground text-sm">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="rounded-full bg-background/80 px-6 py-3 font-medium text-sm transition-colors hover:bg-background"
            onClick={reset}
            type="button"
          >
            Try Again
          </button>
          <Link
            className="rounded-full border border-border/40 bg-primary-foreground/60 px-6 py-3 font-medium text-sm transition-colors hover:bg-background/40"
            href="/"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
