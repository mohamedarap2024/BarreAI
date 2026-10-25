import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// Vercel: force the public production origin so Google OAuth redirect_uri matches Console.
// A leftover AUTH_URL=localhost (or a preview host) causes redirect_uri_mismatch.
if (process.env.VERCEL) {
  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || "barre-ai-umber.vercel.app";
  const productionUrl = productionHost.startsWith("http")
    ? productionHost
    : `https://${productionHost}`;
  if (
    !process.env.AUTH_URL ||
    process.env.AUTH_URL.includes("localhost") ||
    process.env.AUTH_URL.includes(".vercel.app")
  ) {
    // Prefer the stable production domain over per-deployment *.vercel.app URLs.
    process.env.AUTH_URL = productionUrl;
  }
}

const googleId = process.env.AUTH_GOOGLE_ID?.trim();
const googleSecret = process.env.AUTH_GOOGLE_SECRET?.trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions — Google login does not depend on Auth.js DB adapter tables.
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/get-started",
    error: "/get-started",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        const googleSub =
          typeof profile.sub === "string" ? profile.sub : token.sub;

        if (googleSub) token.sub = googleSub;
        if (profile.name) token.name = profile.name;
        if (profile.email) token.email = profile.email;
        if (typeof profile.picture === "string") {
          token.picture = profile.picture;
        }

        // Persist user for conversation ownership (best-effort)
        if (token.sub) {
          try {
            const existing = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.id, token.sub))
              .limit(1);

            if (existing.length === 0) {
              await db.insert(users).values({
                id: token.sub,
                name: (profile.name as string) ?? null,
                email: (profile.email as string) ?? null,
                image:
                  typeof profile.picture === "string" ? profile.picture : null,
                emailVerified: new Date(),
              });
            }
          } catch (error) {
            console.warn("[auth] user upsert skipped:", error);
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },
  trustHost: true,
});
