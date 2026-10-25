import { config } from "dotenv";
import { readFileSync } from "fs";
import postgres from "postgres";

config({ path: ".env.local" });

function getUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return url
    .replace(/([?&])channel_binding=require&?/, "$1")
    .replace(/[?&]$/, "");
}

async function main() {
  const sql = postgres(getUrl(), {
    ssl: "require",
    max: 1,
    connect_timeout: 20,
  });

  try {
    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by 1
    `;
    console.log(
      "existing tables:",
      tables.map((t) => t.table_name).join(", ") || "(none)",
    );

    const ddl = readFileSync("drizzle/0000_init.sql", "utf8");
    const statements = ddl
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      console.log("→", statement.slice(0, 72).replace(/\s+/g, " "), "...");
      await sql.unsafe(statement);
    }

    const after = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by 1
    `;
    console.log(
      "tables after:",
      after.map((t) => t.table_name).join(", "),
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("FAILED:", error.message || error);
  process.exit(1);
});
