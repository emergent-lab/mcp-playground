import { Resend } from "resend";
import { env } from "@/env";

let _resend: Resend | null = null;

export const getResend = () => {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
};
