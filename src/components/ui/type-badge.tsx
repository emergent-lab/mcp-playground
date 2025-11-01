import { Badge } from "@/components/ui/badge";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const typeBadgeVariants = cva("font-mono text-xs", {
  variants: {
    type: {
      string: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      number: "bg-green-500/10 text-green-500 border-green-500/20",
      integer: "bg-green-500/10 text-green-500 border-green-500/20",
      boolean: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      object: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      array: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      enum: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      null: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    },
  },
  defaultVariants: {
    type: "string",
  },
});

export interface TypeBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof typeBadgeVariants> {
  type:
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "object"
    | "array"
    | "enum"
    | "null";
}

export function TypeBadge({ type, className, ...props }: TypeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(typeBadgeVariants({ type }), className)}
      {...props}
    >
      {type}
    </Badge>
  );
}
