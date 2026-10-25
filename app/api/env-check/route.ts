import { NextResponse } from "next/server";

/** Reports which required env vars are present (booleans only — no secrets). */
export async function GET() {
  const present = {
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET?.trim()),
    AUTH_GOOGLE_ID: Boolean(process.env.AUTH_GOOGLE_ID?.trim()),
    AUTH_GOOGLE_SECRET: Boolean(process.env.AUTH_GOOGLE_SECRET?.trim()),
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    AUTH_URL: process.env.AUTH_URL?.trim() || null,
    VERCEL: Boolean(process.env.VERCEL),
  };

  const ok =
    present.AUTH_SECRET &&
    present.AUTH_GOOGLE_ID &&
    present.AUTH_GOOGLE_SECRET &&
    present.DATABASE_URL;

  return NextResponse.json(
    { ok, present },
    { status: ok ? 200 : 503 },
  );
}
