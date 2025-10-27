import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import { server } from "./schema/app";
import { account, session, user, verification } from "./schema/auth";

// Combine both schemas
const schema = {
  user,
  session,
  account,
  verification,
  server,
};

const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = drizzle({ client, schema });
