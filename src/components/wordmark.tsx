import Link from "next/link";

export function Wordmark() {
  return (
    <Link className="flex items-baseline gap-1.5" href="/">
      <span className="font-plek font-semibold text-lg tracking-[0.04em]">
        MCP
      </span>
      <span className="font-light font-plek text-lg tracking-[0.03em]">
        PLAYGROUND
      </span>
    </Link>
  );
}
