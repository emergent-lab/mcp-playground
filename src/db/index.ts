import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import { log, server } from "./schema/app";
import { account, session, user, verification } from "./schema/auth";

// Combine both schemas
const schema = {
  user,
  session,
  account,
  verification,
  server,
  log,
};

const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = drizzle({ client, schema });

export type Database = typeof db;
