import { auth } from "@/auth";
import {
  createConversation,
  listConversations,
} from "@/lib/conversations";
import { z } from "zod";

export const runtime = "nodejs";

const createSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z
    .object({
      id: z.string().min(1),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      createdAt: z.string(),
    })
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await listConversations(session.user.id);
    return Response.json({ conversations, source: "database" });
  } catch (error) {
    console.error("[conversations] list failed:", error);
    // Let the client fall back to local device history instead of a hard 500.
    return Response.json(
      {
        conversations: [],
        source: "unavailable",
        error: "Database unavailable",
      },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    await createConversation({
      userId: session.user.id,
      id: parsed.data.id,
      title: parsed.data.title,
      message: parsed.data.message,
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[conversations] create failed:", error);
    // Client keeps a local copy; don't hard-fail the chat UX.
    return Response.json(
      { ok: false, error: "Database unavailable", savedLocally: true },
      { status: 200 },
    );
  }
}
