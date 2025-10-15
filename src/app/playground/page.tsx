export default function PlaygroundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border/40 bg-primary-foreground/60 p-12 backdrop-blur-xl">
        <h1 className="font-plek font-semibold text-4xl">Playground</h1>
        <p className="text-center text-muted-foreground text-sm">
          Interactive MCP testing and experimentation will go here.
        </p>
      </div>
    </main>
  );
}
