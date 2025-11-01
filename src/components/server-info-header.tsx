import { Badge } from "@/components/ui/badge";

export type ServerInfoHeaderProps = {
  serverName?: string;
  serverUrl: string;
  hasTokens?: boolean;
  requiresAuth?: boolean;
  capabilityType: "tools" | "resources" | "prompts";
  capabilityCount: number;
};

export function ServerInfoHeader({
  serverName,
  serverUrl,
  hasTokens,
  requiresAuth,
  capabilityType,
  capabilityCount,
}: ServerInfoHeaderProps) {
  const displayName = serverName || new URL(serverUrl).hostname;

  return (
    <div className="border-b bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Server:</span>
        <span className="font-medium" title={serverUrl}>
          {displayName}
        </span>

        {requiresAuth && (
          <>
            <span className="text-muted-foreground">|</span>
            {hasTokens ? (
              <Badge className="h-5" variant="default">
                Authenticated
              </Badge>
            ) : (
              <Badge className="h-5" variant="secondary">
                Auth Required
              </Badge>
            )}
          </>
        )}

        <span className="text-muted-foreground">|</span>
        <span className="text-muted-foreground">
          {capabilityCount} {capabilityType}
        </span>
      </div>
    </div>
  );
}
