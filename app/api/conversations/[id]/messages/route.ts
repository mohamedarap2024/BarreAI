import { auth } from "@/auth";
import { appendMessages, replaceMessagesFrom } from "@/lib/conversations";
import { checkBotId } from "botid/server";
import { z } from "zod";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const messageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  createdAt: z.string(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1),
  replaceFrom: z.string().nullable().optional(),
});

export async function POST(request: Request, { params }: Params) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const ok =
    parsed.data.replaceFrom !== undefined
      ? await replaceMessagesFrom(
          session.user.id,
          id,
          parsed.data.replaceFrom,
          parsed.data.messages,
        )
      : await appendMessages(session.user.id, id, parsed.data.messages);

  if (!ok) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
