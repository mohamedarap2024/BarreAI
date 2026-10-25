import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url
    .replace(/([?&])channel_binding=require&?/, "$1")
    .replace(/[?&]$/, "");
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function createDb() {
  const sql = neon(getDatabaseUrl());
  return drizzle(sql, { schema });
}

/** Lazy DB client — avoids crashing auth import when Neon is unreachable at boot. */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    if (!_db) _db = createDb();
    const value = Reflect.get(_db, prop, receiver);
    return typeof value === "function" ? value.bind(_db) : value;
  },
});
