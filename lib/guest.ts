import { cookies } from "next/headers";

export const GUEST_COOKIE = "barre-guest";
export const GUEST_USER_ID = "guest-local";

export async function isGuestSession() {
  const jar = await cookies();
  return jar.get(GUEST_COOKIE)?.value === "1";
}

export function guestUser() {
  return {
    id: GUEST_USER_ID,
    name: "Guest",
    email: "Local device",
    image: null as string | null,
  };
}
