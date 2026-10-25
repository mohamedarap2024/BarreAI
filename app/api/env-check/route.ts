import { NextResponse } from "next/server";

/** Reports which required env vars are present (booleans only — no secrets). */
export async function GET() {
  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || "barre-ai-umber.vercel.app";
  const forcedAuthUrl = productionHost.startsWith("http")
    ? productionHost
    : `https://${productionHost}`;
  const rawAuthUrl = process.env.AUTH_URL?.trim() || null;
  const authUrl =
    process.env.VERCEL &&
    (!rawAuthUrl ||
      rawAuthUrl.includes("localhost") ||
      rawAuthUrl.includes(".vercel.app"))
      ? forcedAuthUrl
      : rawAuthUrl;
  const present = {
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET?.trim()),
    AUTH_GOOGLE_ID: Boolean(process.env.AUTH_GOOGLE_ID?.trim()),
    AUTH_GOOGLE_SECRET: Boolean(process.env.AUTH_GOOGLE_SECRET?.trim()),
    DATABASE_URL: Boolean(process.env.DATABASE_URL?.trim()),
    OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    AUTH_URL_raw: rawAuthUrl,
    AUTH_URL_effective: authUrl,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
    expected_google_redirect_uri: authUrl
      ? `${authUrl.replace(/\/$/, "")}/api/auth/callback/google`
      : null,
    google_client_id_suffix: process.env.AUTH_GOOGLE_ID?.trim().slice(-20) || null,
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
