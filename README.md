# BarreAI

Somali AI chat app built with Next.js, Auth.js (Google), Neon Postgres, OpenRouter, and xKiro.

## Local setup

```bash
npm install
cp .env.example .env.local
# Fill in real values in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](.env.example). Required keys:

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | OpenRouter chat (optional if xKiro is set) |
| `OPENROUTER_MODEL` | Default OpenRouter model (optional) |
| `XKIRO_API_KEY` | xKiro chat (optional if OpenRouter is set) |
| `XKIRO_MODEL` | Default xKiro model (optional) |
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | Auth.js session encryption |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `AUTH_URL` | App origin (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

**Never commit `.env.local`.** It is gitignored.

## Deploy on Vercel

1. Push this repo to GitHub (already configured as `BarreAI`).
2. Import the repo in [Vercel](https://vercel.com/new).
3. In **Project → Settings → Environment Variables**, add every key from `.env.example` with your real values.
4. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel URL, e.g. `https://barreai.vercel.app`.
5. In Google Cloud Console, add that URL to OAuth **Authorized JavaScript origins** and redirect URI:
   `https://YOUR_PROJECT.vercel.app/api/auth/callback/google`
6. Deploy / redeploy.
