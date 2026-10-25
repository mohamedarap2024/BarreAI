import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  // neon-http works reliably without channel_binding
  return url.replace(/([?&])channel_binding=require&?/, "$1").replace(/[?&]$/, "");
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | undefined;

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = drizzle(neon(getDatabaseUrl()), { schema });
    }
    return Reflect.get(_db, prop, receiver);
  },
});
