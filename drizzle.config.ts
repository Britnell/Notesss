import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    // url: import.meta.env.TURSO_DATABASE_URL,
    // authToken: import.meta.env.TURSO_AUTH_TOKEN,
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
