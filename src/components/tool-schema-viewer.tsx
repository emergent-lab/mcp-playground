import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { SchemaPropertyRow } from "@/components/schema-property-row";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type { ToolInputSchema, ToolOutputSchema } from "@/lib/schema-types";
import {
  getObjectProperties,
  getObjectRequiredFields,
} from "@/lib/schema-utils";

export type ToolSchemaViewerProps = {
  inputSchema?: ToolInputSchema;
  outputSchema?: ToolOutputSchema;
};

export function ToolSchemaViewer({
  inputSchema,
  outputSchema,
}: ToolSchemaViewerProps) {
  const [inputOpen, setInputOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(false);

  const hasInputSchema = inputSchema?.properties;
  const hasOutputSchema = outputSchema?.properties;

  if (!(hasInputSchema || hasOutputSchema)) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        No schema information available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasInputSchema && (
        <Collapsible onOpenChange={setInputOpen} open={inputOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-sm px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-accent">
            <span>Input Parameters</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${inputOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 px-4 pb-2">
            {inputSchema.description && (
              <p className="py-2 text-muted-foreground text-sm">
                {inputSchema.description}
              </p>
            )}
            <div className="space-y-2">
              {Object.entries(getObjectProperties(inputSchema)).map(
                ([name, schema]) => {
                  const requiredFields = getObjectRequiredFields(inputSchema);
                  const isRequired = requiredFields.includes(name);

                  return (
                    <SchemaPropertyRow
                      key={name}
                      level={0}
                      name={name}
                      required={isRequired}
                      schema={schema}
                    />
                  );
                }
              )}
            </div>
            {Object.keys(getObjectProperties(inputSchema)).length === 0 && (
              <p className="py-2 text-muted-foreground text-sm">
                No parameters required
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {hasInputSchema && hasOutputSchema && <Separator />}

      {hasOutputSchema && (
        <Collapsible onOpenChange={setOutputOpen} open={outputOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-sm px-4 py-2 font-medium text-foreground text-sm transition-colors hover:bg-accent">
            <span>Output Schema</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${outputOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 px-4 pb-2">
            {outputSchema.description && (
              <p className="py-2 text-muted-foreground text-sm">
                {outputSchema.description}
              </p>
            )}
            <div className="space-y-2">
              {Object.entries(getObjectProperties(outputSchema)).map(
                ([name, schema]) => {
                  const requiredFields = getObjectRequiredFields(outputSchema);
                  const isRequired = requiredFields.includes(name);

                  return (
                    <SchemaPropertyRow
                      key={name}
                      level={0}
                      name={name}
                      required={isRequired}
                      schema={schema}
                    />
                  );
                }
              )}
            </div>
            {Object.keys(getObjectProperties(outputSchema)).length === 0 && (
              <p className="py-2 text-muted-foreground text-sm">
                No output schema defined
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
