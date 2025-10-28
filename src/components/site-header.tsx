import { BlurReveal } from "@/components/blur-reveal";

export function SiteHeader() {
  return (
    <div className="flex w-full justify-start">
      <BlurReveal blur={3} duration={400}>
        <h1 className="whitespace-nowrap font-mono text-xl tracking-tight">
          <span className="font-semibold text-foreground">mcp</span>{" "}
          <span className="font-normal text-foreground/70">playground</span>
        </h1>
      </BlurReveal>
    </div>
  );
}
