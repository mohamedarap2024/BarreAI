"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { GUEST_COOKIE } from "@/lib/guest";

export async function signInWithGoogle() {
  const jar = await cookies();
  jar.delete(GUEST_COOKIE);
  await signIn("google", { redirectTo: "/" });
}

export async function continueAsGuest() {
  const jar = await cookies();
  jar.set(GUEST_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/");
}

export async function signOutAction() {
  const jar = await cookies();
  jar.delete(GUEST_COOKIE);
  await signOut({ redirectTo: "/get-started" });
}
