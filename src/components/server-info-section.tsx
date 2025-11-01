import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type ServerInfoSectionProps = {
  serverName?: string;
  serverUrl: string;
  hasTokens?: boolean;
  requiresAuth?: boolean;
  toolCount: number;
  resourceCount: number;
  promptCount: number;
};

export function ServerInfoSection({
  serverName,
  serverUrl,
  hasTokens,
  requiresAuth,
  toolCount,
  resourceCount,
  promptCount,
}: ServerInfoSectionProps) {
  const displayName = serverName || new URL(serverUrl).hostname;
  const isAuthenticated = hasTokens && requiresAuth;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base leading-none tracking-tight">
              {displayName}
            </h2>
            {requiresAuth && (
              <Badge
                className={
                  isAuthenticated
                    ? "border-green-500/20 bg-green-500/10 text-green-500"
                    : "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
                }
                variant="outline"
              >
                {isAuthenticated ? "Authenticated" : "Auth Required"}
              </Badge>
            )}
          </div>
          <p className="break-all font-mono text-muted-foreground text-sm">
            {serverUrl}
          </p>
        </div>

        <Separator />

        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{toolCount}</span>
            <span>{toolCount === 1 ? "tool" : "tools"}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{resourceCount}</span>
            <span>{resourceCount === 1 ? "resource" : "resources"}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">{promptCount}</span>
            <span>{promptCount === 1 ? "prompt" : "prompts"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
