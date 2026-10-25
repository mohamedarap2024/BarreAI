import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions — Google login does not depend on Auth.js DB adapter tables.
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
