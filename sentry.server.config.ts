// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// biome-ignore lint/performance/noNamespaceImport: Sentry is a namespace import
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c9487c1830ec37fcfc2c9a0c0ddf9f3c@o4510304141967360.ingest.us.sentry.io/4510304142688256",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
