import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border/40 bg-primary-foreground/60 p-12 backdrop-blur-xl">
        <Wordmark />
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-plek font-semibold text-6xl">404</h1>
          <h2 className="font-medium text-xl">Page Not Found</h2>
          <p className="text-center text-muted-foreground text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link
          className="rounded-full bg-background/80 px-6 py-3 font-medium text-sm transition-colors hover:bg-background"
          href="/"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
