import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatShell } from "@/components/chat-shell";
import { guestUser, isGuestSession } from "@/lib/guest";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    return (
      <ChatShell
        user={{
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
        }}
      />
    );
  }

  if (await isGuestSession()) {
    return <ChatShell user={guestUser()} />;
  }

  redirect("/get-started");
}
