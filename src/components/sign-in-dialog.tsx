"use client";

import { SignIn } from "@/components/sign-in";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SignInDialogProps = {
  className?: string;
};

export function SignInDialog({ className }: SignInDialogProps = {}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={className} size="sm" variant="outline">
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to save your servers and access them from anywhere
          </DialogDescription>
        </DialogHeader>
        <SignIn />
      </DialogContent>
    </Dialog>
  );
}
