import { Logo } from "@/components/logo";

export function SiteHeader() {
  return (
    <div className="flex items-center gap-0.5">
      <Logo className="translate-y-0.25" height={32} width={32} />
      <h1 className="font-semibold text-2xl tracking-tight">MCP Playground</h1>
    </div>
  );
}
