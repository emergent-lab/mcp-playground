"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type AutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onLoadCompletions?: (query: string) => Promise<string[]>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  "aria-invalid"?: boolean;
};

export function Autocomplete({
  value,
  onChange,
  onLoadCompletions,
  placeholder = "Type to search...",
  disabled = false,
  className,
  id,
  name,
  autoComplete,
  "aria-invalid": ariaInvalid,
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(value);
  const [debouncedSearch, setDebouncedSearch] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // Fetch completions if onLoadCompletions is provided
  const { data: completions = [], isLoading } = useQuery({
    queryKey: ["completions", debouncedSearch],
    queryFn: async () => {
      if (!onLoadCompletions || debouncedSearch.length === 0) {
        return [];
      }
      return onLoadCompletions(debouncedSearch);
    },
    enabled: !!onLoadCompletions && debouncedSearch.length > 0,
    staleTime: 60_000, // 1 minute
  });

  const handleSelect = (selectedValue: string) => {
    setSearch(selectedValue);
    onChange(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setSearch(newValue);
    onChange(newValue);
    if (newValue.length > 0 && onLoadCompletions) {
      setOpen(true);
    }
  };

  // Update search when value prop changes (e.g., from reset)
  React.useEffect(() => {
    setSearch(value);
  }, [value]);

  // Maintain input focus when popover opens or completions update
  React.useEffect(() => {
    if (open && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, completions]);

  // If no completion function provided, just render a regular input
  if (!onLoadCompletions) {
    return (
      <input
        aria-invalid={ariaInvalid}
        autoComplete={autoComplete}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
        id={id}
        name={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <input
            ref={inputRef}
            aria-invalid={ariaInvalid}
            autoComplete={autoComplete}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            disabled={disabled}
            id={id}
            name={name}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (search.length > 0) {
                setOpen(true);
              }
            }}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={open}
            type="text"
            value={search}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            ) : completions.length === 0 ? (
              <CommandEmpty>No suggestions found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {completions.map((completion) => (
                  <CommandItem
                    key={completion}
                    onSelect={() => handleSelect(completion)}
                    value={completion}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === completion ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {completion}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
