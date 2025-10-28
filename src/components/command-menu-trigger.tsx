"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useCommandMenu } from "@/contexts/command-menu-context";

export function CommandMenuTrigger() {
  const { setOpen } = useCommandMenu();

  return (
    <button
      className="w-full max-w-md cursor-pointer"
      onClick={() => setOpen(true)}
      type="button"
    >
      <InputGroup className="h-8">
        <InputGroupInput
          className="cursor-pointer"
          placeholder="Search..."
          readOnly
        />
        <InputGroupAddon align="inline-end">
          <KbdGroup>
            <Kbd className="border">⌘</Kbd>
            <Kbd className="border">K</Kbd>
          </KbdGroup>
        </InputGroupAddon>
      </InputGroup>
    </button>
  );
}
