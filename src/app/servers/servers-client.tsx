"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { McpServerSummary } from "@/lib/mcp/manager";
import { cn } from "@/lib/utils";

import {
  type AddServerPayload,
  addServerAction,
  connectServerAction,
  disconnectServerAction,
  fetchServerDetailsAction,
  refreshServersAction,
  removeServerAction,
  type ServerDetailsSnapshot,
} from "./actions";

type ServersClientProps = {
  initialServers: McpServerSummary[];
};

type FeedbackTone = "negative" | "positive";

type FeedbackState = {
  tone: FeedbackTone;
  text: string;
} | null;

type FormState = {
  id: string;
  transport: "http" | "sse" | "stdio";
  url: string;
  timeoutMs: string;
  autoConnect: boolean;
  preferSse: boolean;
  command: string;
  args: string;
  cwd: string;
};

type TransportOption = {
  value: AddServerPayload["transport"];
  label: string;
  description: string;
};

const FORM_LABEL_CLASS = "font-medium text-sm";
const CARD_CHROME_CLASS =
  "backdrop-blur border border-border/40 bg-primary-foreground/50 p-6 rounded-3xl shadow-black/5 shadow-lg";
const SELECT_BASE_CLASS =
  "border border-input bg-transparent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 h-9 rounded-md px-3 text-sm outline-none shadow-xs transition-[color,box-shadow] w-full";
const ARG_SPLIT_REGEX = /[,\\n]/;

const DEFAULT_FORM_STATE: FormState = {
  id: "",
  transport: "http",
  url: "",
  command: "",
  args: "",
  cwd: "",
  timeoutMs: "",
  autoConnect: true,
  preferSse: false,
};

const TRANSPORT_OPTIONS: TransportOption[] = [
  {
    value: "http",
    label: "HTTP",
    description: "Streamable HTTP connection, with optional SSE fallback.",
  },
  {
    value: "sse",
    label: "SSE",
    description: "Direct Server-Sent Events connection to the endpoint.",
  },
];

function ServersClient({ initialServers }: ServersClientProps) {
  const [servers, setServers] = useState(initialServers);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialServers[0]?.id ?? null
  );
  const [details, setDetails] = useState<ServerDetailsSnapshot | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [isMutating, startMutation] = useTransition();
  const [isLoadingDetails, startDetailsTransition] = useTransition();

  const selectedSummary = useMemo(
    () => servers.find((entry) => entry.id === selectedId) ?? null,
    [servers, selectedId]
  );

  const runMutation = useCallback((task: () => Promise<void>) => {
    startMutation(() => {
      task().catch((error: unknown) => {
        setFeedback({
          tone: "negative",
          text: formatClientError(error),
        });
      });
    });
  }, []);

  const loadDetails = useCallback((serverId: string) => {
    startDetailsTransition(() => {
      fetchServerDetailsAction(serverId)
        .then((response) => {
          if (response.success) {
            setDetails(response.data);
          } else {
            setDetails(null);
            setFeedback({
              tone: "negative",
              text: response.error,
            });
          }
        })
        .catch((error: unknown) => {
          setDetails(null);
          setFeedback({
            tone: "negative",
            text: formatClientError(error),
          });
        });
    });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetails(null);
      return;
    }
    loadDetails(selectedId);
  }, [selectedId, loadDetails]);

  const handleFormChange = useCallback((update: Partial<FormState>) => {
    setFormState((previous) => ({ ...previous, ...update }));
  }, []);

  const handleAddServer = useCallback(() => {
    const payload = buildAddPayload(formState);
    if (!payload) {
      setFeedback({
        tone: "negative",
        text: "Provide the required fields for the selected transport.",
      });
      return;
    }

    runMutation(async () => {
      const response = await addServerAction(payload);
      if (!response.success) {
        setFeedback({
          tone: "negative",
          text: response.error,
        });
        return;
      }

      setServers(response.data);
      setFeedback({
        tone: "positive",
        text: response.message ?? "Server added.",
      });
      setFormState(DEFAULT_FORM_STATE);
      setSelectedId(payload.id);
      loadDetails(payload.id);
    });
  }, [formState, loadDetails, runMutation]);

  const handleRefresh = useCallback(() => {
    runMutation(async () => {
      const response = await Promise.resolve(refreshServersAction());
      if (!response.success) {
        setFeedback({
          tone: "negative",
          text: response.error,
        });
        return;
      }

      setServers(response.data);
      setFeedback({
        tone: "positive",
        text: "Server list refreshed.",
      });

      if (
        selectedId &&
        response.data.every((entry) => entry.id !== selectedId)
      ) {
        const nextSelection = response.data[0]?.id ?? null;
        setSelectedId(nextSelection);
        if (nextSelection) {
          loadDetails(nextSelection);
        } else {
          setDetails(null);
        }
      }
    });
  }, [loadDetails, runMutation, selectedId]);

  const handleConnect = useCallback(() => {
    if (!selectedId) {
      return;
    }
    runMutation(async () => {
      const response = await connectServerAction(selectedId);
      if (!response.success) {
        setFeedback({
          tone: "negative",
          text: response.error,
        });
        return;
      }
      setServers(response.data);
      setFeedback({
        tone: "positive",
        text: "Connection request sent.",
      });
      loadDetails(selectedId);
    });
  }, [loadDetails, runMutation, selectedId]);

  const handleDisconnect = useCallback(() => {
    if (!selectedId) {
      return;
    }
    runMutation(async () => {
      const response = await disconnectServerAction(selectedId);
      if (!response.success) {
        setFeedback({
          tone: "negative",
          text: response.error,
        });
        return;
      }
      setServers(response.data);
      setFeedback({
        tone: "positive",
        text: "Server disconnected.",
      });
      loadDetails(selectedId);
    });
  }, [loadDetails, runMutation, selectedId]);

  const handleRemove = useCallback(() => {
    if (!selectedId) {
      return;
    }
    runMutation(async () => {
      const response = await removeServerAction(selectedId);
      if (!response.success) {
        setFeedback({
          tone: "negative",
          text: response.error,
        });
        return;
      }
      setServers(response.data);
      setFeedback({
        tone: "positive",
        text: response.message ?? "Server removed.",
      });

      if (response.data.length === 0) {
        setSelectedId(null);
        setDetails(null);
        return;
      }

      const nextSelection = response.data[0]?.id ?? null;
      setSelectedId(nextSelection);
      if (nextSelection) {
        loadDetails(nextSelection);
      } else {
        setDetails(null);
      }
    });
  }, [loadDetails, runMutation, selectedId]);

  const handleSelectServer = useCallback((serverId: string) => {
    setSelectedId(serverId);
  }, []);

  const status = selectedSummary?.status ?? "disconnected";
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10">
      <header className="flex flex-col gap-2">
        <span className="text-primary text-xs uppercase tracking-[0.3em]">
          MCP Playground
        </span>
        <h1 className="font-plek font-semibold text-4xl tracking-tight md:text-5xl">
          Connected MCP Servers
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm md:text-base">
          Add, connect, and inspect Model Context Protocol servers in your
          workspace. Review available tools and resources in real time.
        </p>
      </header>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col gap-8">
          <AddServerForm
            disabled={isMutating}
            formState={formState}
            onChange={handleFormChange}
            onSubmit={handleAddServer}
          />
          <ServerList
            disabled={isMutating}
            onRefresh={handleRefresh}
            onSelect={handleSelectServer}
            selectedId={selectedId}
            servers={servers}
          />
        </aside>

        <section className="rounded-3xl border border-border/40 bg-primary-foreground/60 p-8 shadow-black/10 shadow-xl backdrop-blur-xl">
          {selectedSummary ? (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-semibold text-2xl">
                    {selectedSummary.id}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedSummary.config.transport.toUpperCase()} transport •{" "}
                    <StatusBadge status={selectedSummary.status} subtle />
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    disabled={isMutating || isConnected || isConnecting}
                    onClick={handleConnect}
                    size="sm"
                  >
                    Connect
                  </Button>
                  <Button
                    disabled={isMutating || !isConnected}
                    onClick={handleDisconnect}
                    size="sm"
                    variant="outline"
                  >
                    Disconnect
                  </Button>
                  <Button
                    disabled={isMutating}
                    onClick={handleRemove}
                    size="sm"
                    variant="destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {feedback ? <FeedbackBanner feedback={feedback} /> : null}

              {selectedSummary.lastError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
                  {selectedSummary.lastError}
                </div>
              ) : null}

              <div className="mt-10 grid gap-6 md:grid-cols-3">
                <InfoTile label="Status">
                  {camelToTitle(selectedSummary.status)}
                </InfoTile>
                <InfoTile label="Transport">
                  {selectedSummary.config.transport.toUpperCase()}
                </InfoTile>
                <InfoTile label="Timeout">
                  {selectedSummary.config.timeoutMs
                    ? `${selectedSummary.config.timeoutMs} ms`
                    : "Default"}
                </InfoTile>
              </div>

              <div className="mt-10 space-y-8">
                <SectionCard
                  contentClassName="max-w-3xl"
                  emptyMessage="No tools published yet."
                  getKey={(tool) => tool.name}
                  isLoading={isLoadingDetails}
                  items={details?.tools ?? []}
                  renderItem={(tool) => (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{tool.name}</span>
                        {tool.description ? (
                          <p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
                            {formatToolDescription(tool.description)}
                          </p>
                        ) : null}
                      </div>
                      {tool.schema ? (
                        <SchemaPreview schema={tool.schema} />
                      ) : null}
                    </div>
                  )}
                  title="Tools"
                />

                <SectionCard
                  emptyMessage="No resources available."
                  getKey={(resource) => resource.uri}
                  isLoading={isLoadingDetails}
                  items={details?.resources ?? []}
                  renderItem={(resource) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{resource.uri}</span>
                      {resource.name ? (
                        <span className="text-muted-foreground text-xs">
                          {resource.name}
                        </span>
                      ) : null}
                      {resource.description ? (
                        <span className="text-muted-foreground text-xs">
                          {resource.description}
                        </span>
                      ) : null}
                    </div>
                  )}
                  title="Resources"
                />

                <SectionCard
                  emptyMessage="No resource templates available."
                  getKey={(template) => template.name}
                  isLoading={isLoadingDetails}
                  items={details?.resourceTemplates ?? []}
                  renderItem={(template) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{template.name}</span>
                      {template.description ? (
                        <span className="text-muted-foreground text-xs">
                          {template.description}
                        </span>
                      ) : null}
                    </div>
                  )}
                  title="Resource Templates"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-muted-foreground text-sm">
              <span className="font-semibold text-foreground text-lg">
                No server selected
              </span>
              <p className="max-w-sm">
                Add a server or choose one from the list to inspect its declared
                tools and resources.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type AddServerFormProps = {
  disabled: boolean;
  formState: FormState;
  onChange: (update: Partial<FormState>) => void;
  onSubmit: () => void;
};

function AddServerForm({
  disabled,
  formState,
  onChange,
  onSubmit,
}: AddServerFormProps) {
  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit();
    },
    [onSubmit]
  );

  return (
    <section className={CARD_CHROME_CLASS}>
      <h2 className="font-semibold text-lg">Add server</h2>
      <p className="mt-1 text-muted-foreground text-xs">
        Configure a new MCP endpoint. Fields adapt based on the transport you
        choose.
      </p>
      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className={FORM_LABEL_CLASS} htmlFor="server-id">
            Identifier
          </label>
          <Input
            autoComplete="off"
            disabled={disabled}
            id="server-id"
            onChange={(event) => onChange({ id: event.target.value })}
            placeholder="brave-search"
            value={formState.id}
          />
        </div>

        <div className="space-y-2">
          <label className={FORM_LABEL_CLASS} htmlFor="server-transport">
            Transport
          </label>
          <select
            className={SELECT_BASE_CLASS}
            disabled={disabled}
            id="server-transport"
            onChange={(event) =>
              onChange({
                transport: event.target.value as FormState["transport"],
              })
            }
            value={formState.transport}
          >
            {TRANSPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            {
              TRANSPORT_OPTIONS.find(
                (option) => option.value === formState.transport
              )?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <label className={FORM_LABEL_CLASS} htmlFor="server-url">
            Server URL
          </label>
          <Input
            autoComplete="off"
            disabled={disabled}
            id="server-url"
            onChange={(event) => onChange({ url: event.target.value })}
            placeholder="https://example.com/mcp"
            value={formState.url}
          />
        </div>

        {formState.transport === "http" && (
          <label className="flex items-center gap-2 text-muted-foreground text-xs">
            <input
              checked={formState.preferSse}
              className="size-4 accent-primary"
              disabled={disabled}
              onChange={(event) =>
                onChange({ preferSse: event.target.checked })
              }
              type="checkbox"
            />
            Prefer direct SSE when available
          </label>
        )}

        <div className="space-y-2">
          <label className={FORM_LABEL_CLASS} htmlFor="server-timeout">
            Timeout (ms)
          </label>
          <Input
            autoComplete="off"
            disabled={disabled}
            id="server-timeout"
            inputMode="numeric"
            min={1000}
            onChange={(event) => onChange({ timeoutMs: event.target.value })}
            placeholder="10000"
            type="number"
            value={formState.timeoutMs}
          />
        </div>

        <label className="flex items-center gap-2 text-muted-foreground text-xs">
          <input
            checked={formState.autoConnect}
            className="size-4 accent-primary"
            disabled={disabled}
            onChange={(event) =>
              onChange({ autoConnect: event.target.checked })
            }
            type="checkbox"
          />
          Attempt connection immediately
        </label>

        <Button disabled={disabled} type="submit">
          {disabled ? "Saving…" : "Add server"}
        </Button>
      </form>
    </section>
  );
}

type ServerListProps = {
  disabled: boolean;
  onRefresh: () => void;
  onSelect: (serverId: string) => void;
  selectedId: string | null;
  servers: McpServerSummary[];
};

function ServerList({
  disabled,
  onRefresh,
  onSelect,
  selectedId,
  servers,
}: ServerListProps) {
  return (
    <section className={CARD_CHROME_CLASS}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg">Servers</h2>
          <p className="text-muted-foreground text-xs">
            Select a server to inspect its tools and resources.
          </p>
        </div>
        <Button
          className="text-xs"
          disabled={disabled}
          onClick={onRefresh}
          size="sm"
          variant="outline"
        >
          Refresh
        </Button>
      </div>
      {servers.length === 0 ? (
        <p className="rounded-2xl border border-border/60 border-dashed p-6 text-center text-muted-foreground text-sm">
          No MCP servers configured yet. Add one to get started.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {servers.map((server) => (
            <li key={server.id}>
              <button
                className={cn(
                  "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                  "hover:border-border/60 hover:bg-accent/40",
                  selectedId === server.id
                    ? "border-border/60 bg-accent/40 shadow-inner"
                    : "border-transparent bg-transparent"
                )}
                onClick={() => onSelect(server.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{server.id}</span>
                      <StatusBadge status={server.status} />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {server.config.transport.toUpperCase()}
                    </p>
                  </div>
                  {server.lastError ? (
                    <span className="text-destructive text-xs">
                      {server.lastError}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type FeedbackBannerProps = {
  feedback: Exclude<FeedbackState, null>;
};

function FeedbackBanner({ feedback }: FeedbackBannerProps) {
  const palette =
    feedback.tone === "positive"
      ? {
          background: "bg-primary/10",
          text: "text-primary",
        }
      : {
          background: "bg-destructive/10",
          text: "text-destructive",
        };

  return (
    <div
      className={cn(
        "mt-4 rounded-2xl px-4 py-3 text-sm",
        palette.background,
        palette.text
      )}
    >
      {feedback.text}
    </div>
  );
}

type StatusBadgeProps = {
  status: McpServerSummary["status"];
  subtle?: boolean;
};

function StatusBadge({ status, subtle }: StatusBadgeProps) {
  let palette: { dot: string; text: string };
  if (status === "connected") {
    palette = {
      dot: "bg-emerald-400",
      text: subtle ? "text-emerald-400" : "text-emerald-500",
    };
  } else if (status === "connecting") {
    palette = {
      dot: "bg-amber-400",
      text: subtle ? "text-amber-400" : "text-amber-500",
    };
  } else {
    palette = {
      dot: "bg-muted-foreground/40",
      text: subtle ? "text-muted-foreground" : "text-muted-foreground/80",
    };
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium text-xs",
        palette.text
      )}
    >
      <span className={cn("size-2 rounded-full", palette.dot)} />
      {camelToTitle(status)}
    </span>
  );
}

type InfoTileProps = {
  label: string;
  children: React.ReactNode;
};

function InfoTile({ label, children }: InfoTileProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/70 px-4 py-3">
      <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
        {label}
      </span>
      <div className="mt-2 font-medium text-foreground text-sm">{children}</div>
    </div>
  );
}

type SectionCardProps<Item> = {
  title: string;
  items: Item[];
  renderItem: (item: Item) => React.ReactNode;
  emptyMessage: string;
  isLoading: boolean;
  getKey: (item: Item) => string;
  contentClassName?: string;
};

function SectionCard<Item>({
  title,
  items,
  renderItem,
  emptyMessage,
  isLoading,
  getKey,
  contentClassName,
}: SectionCardProps<Item>) {
  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <p className="rounded-xl border border-border/50 border-dashed p-4 text-muted-foreground text-xs">
        {emptyMessage}
      </p>
    );
  } else {
    content = (
      <ul className="space-y-3 text-sm">
        {items.map((item) => (
          <li
            className="rounded-xl border border-border/30 bg-primary-foreground/40 p-4"
            key={getKey(item)}
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/30 bg-background/70 p-5",
        contentClassName
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-base">{title}</h3>
        <span className="text-muted-foreground text-xs">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>
      {content}
    </div>
  );
}

type SchemaPreviewProps = {
  schema: unknown;
};

function SchemaPreview({ schema }: SchemaPreviewProps) {
  const formatted = formatSchema(schema);
  if (!formatted) {
    return null;
  }
  return (
    <pre className="max-h-48 overflow-auto rounded-xl bg-muted/40 p-3 font-mono text-muted-foreground text-xs">
      {formatted}
    </pre>
  );
}

function buildAddPayload(form: FormState): AddServerPayload | null {
  const trimmedId = form.id.trim();
  if (!trimmedId) {
    return null;
  }

  const timeoutMs = parseTimeout(form.timeoutMs);
  if (timeoutMs === null) {
    return null;
  }

  switch (form.transport) {
    case "http":
      return buildHttpPayload(form, trimmedId, timeoutMs);
    case "sse":
      return buildSsePayload(form, trimmedId, timeoutMs);
    case "stdio":
      return buildStdioPayload(form, trimmedId, timeoutMs);
    default:
      return null;
  }
}

function parseTimeout(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildHttpPayload(
  form: FormState,
  id: string,
  timeoutMs: number | undefined
): AddServerPayload | null {
  const trimmedUrl = form.url.trim();
  if (!trimmedUrl) {
    return null;
  }
  return {
    id,
    transport: "http",
    url: trimmedUrl,
    timeoutMs,
    preferSse: form.preferSse,
    allowSseFallback: true,
    autoConnect: form.autoConnect,
  };
}

function buildSsePayload(
  form: FormState,
  id: string,
  timeoutMs: number | undefined
): AddServerPayload | null {
  const trimmedUrl = form.url.trim();
  if (!trimmedUrl) {
    return null;
  }
  return {
    id,
    transport: "sse",
    url: trimmedUrl,
    timeoutMs,
    autoConnect: form.autoConnect,
  };
}

function buildStdioPayload(
  form: FormState,
  id: string,
  timeoutMs: number | undefined
): AddServerPayload | null {
  const trimmedCommand = form.command.trim();
  if (!trimmedCommand) {
    return null;
  }
  const args = normaliseArgs(form.args);
  return {
    id,
    transport: "stdio",
    command: trimmedCommand,
    args: args.length > 0 ? args : undefined,
    cwd: form.cwd.trim() || undefined,
    timeoutMs,
    autoConnect: form.autoConnect,
  };
}

function normaliseArgs(source: string): string[] {
  return source
    .split(ARG_SPLIT_REGEX)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function formatSchema(schema: unknown): string | null {
  try {
    return JSON.stringify(schema, null, 2);
  } catch {
    return null;
  }
}

function camelToTitle(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatClientError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function formatToolDescription(description: string): string {
  return description.replace(/\r\n/g, "\n").replace(/\*\*/g, "").trim();
}

export default ServersClient;
