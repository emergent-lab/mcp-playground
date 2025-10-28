"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

type AddServerDialogContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AddServerDialogContext = createContext<
  AddServerDialogContextType | undefined
>(undefined);

export function AddServerDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AddServerDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AddServerDialogContext.Provider>
  );
}

export function useAddServerDialog() {
  const context = useContext(AddServerDialogContext);
  if (context === undefined) {
    throw new Error(
      "useAddServerDialog must be used within AddServerDialogProvider"
    );
  }
  return context;
}
