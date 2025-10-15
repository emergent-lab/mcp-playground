import { cn } from "@/lib/utils";

const BreakpointIndicator = ({ className }: { className?: string }) => {
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return (
    <div
      className={cn(
        "bottom-1 left-1 z-50 flex size-6 items-center justify-center rounded-full bg-black p-2 font-mono text-white text-xs",
        className
      )}
    >
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  );
};

export { BreakpointIndicator };
