import { readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url
    .replace(/([?&])channel_binding=require&?/, "$1")
    .replace(/[?&]$/, "");
}

/** One-time schema bootstrap — only available in development. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available" }, { status: 403 });
  }

  try {
    const sql = neon(getDatabaseUrl());
    const ddl = readFileSync(
      join(process.cwd(), "drizzle", "0000_init.sql"),
      "utf8",
    );
    const statements = ddl
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await sql.query(statement);
    }

    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by 1
    `;

    return Response.json({
      ok: true,
      tables: tables.map((t) => t.table_name),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
