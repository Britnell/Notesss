import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";

export const tursoClient = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

import * as schema from "./schema";

export const db = drizzle(tursoClient, { schema });
