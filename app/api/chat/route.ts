import { auth } from "@/auth";
import {
  createChatStream,
  getChatConfig,
  openRouterSseToTextStream,
} from "@/lib/openrouter";
import { chatRequestSchema, DEFAULT_MODEL } from "@/lib/validation";
import { checkBotId } from "botid/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT =
  "You are Barre AI. Answer clearly and briefly unless asked for more detail. Use simple Markdown.";

const CONNECT_TIMEOUT_MS = 45_000;

export async function POST(request: Request) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Sign in to chat" }, { status: 401 });
  }

  const { configured, model: defaultModel } = getChatConfig();

  if (!configured) {
    return Response.json(
      {
        error:
          "No chat API configured. Add OPENROUTER_API_KEY and/or XKIRO_API_KEY to your environment.",
      },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const model = parsed.data.model ?? defaultModel ?? DEFAULT_MODEL;
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...parsed.data.messages
      .filter((m) => m.role !== "system" && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content.trim() })),
  ];

  if (messages.length < 2) {
    return Response.json({ error: "No user message provided" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const upstreamAbort = new AbortController();

  const onClientAbort = () => upstreamAbort.abort();
  request.signal.addEventListener("abort", onClientAbort);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const timeout = setTimeout(() => {
        upstreamAbort.abort();
      }, CONNECT_TIMEOUT_MS);

      try {
        const upstream = await createChatStream({
          messages,
          model,
          signal: upstreamAbort.signal,
        });
        clearTimeout(timeout);

        const textStream = openRouterSseToTextStream(upstream);
        const reader = textStream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (error) {
        clearTimeout(timeout);
        const aborted = upstreamAbort.signal.aborted && !request.signal.aborted;
        const message = aborted
          ? "Model took too long to start. Try again, or pick another model."
          : error instanceof Error
            ? error.message
            : "Failed to reach the chat API";

        try {
          controller.enqueue(encoder.encode(`Error: ${message}`));
          controller.close();
        } catch {
          // controller already closed
        }
      } finally {
        request.signal.removeEventListener("abort", onClientAbort);
      }
    },
    cancel() {
      upstreamAbort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Barre-Model": model,
    },
  });
}
