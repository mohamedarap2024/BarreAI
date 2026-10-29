import {
  DEFAULT_MODEL,
  getModelProvider,
  type ChatProvider,
} from "@/lib/validation";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const XKIRO_URL = "https://api.xkiro.com/v1/chat/completions";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function getChatConfig() {
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim() || null;
  const xkiroKey = process.env.XKIRO_API_KEY?.trim() || null;
  const model =
    process.env.XKIRO_MODEL?.trim() ||
    process.env.OPENROUTER_MODEL?.trim() ||
    DEFAULT_MODEL;

  return {
    openrouterKey,
    xkiroKey,
    model,
    configured: Boolean(openrouterKey || xkiroKey),
  };
}

/** @deprecated Use getChatConfig — kept for existing imports. */
export function getOpenRouterConfig() {
  const cfg = getChatConfig();
  return {
    apiKey: cfg.openrouterKey || cfg.xkiroKey,
    model: cfg.model,
    configured: cfg.configured,
  };
}

function providerLabel(provider: ChatProvider) {
  return provider === "xkiro" ? "xKiro" : "OpenRouter";
}

export async function createChatStream(options: {
  messages: OpenRouterMessage[];
  model: string;
  signal?: AbortSignal;
}) {
  const provider = getModelProvider(options.model);
  const cfg = getChatConfig();
  const apiKey = provider === "xkiro" ? cfg.xkiroKey : cfg.openrouterKey;

  if (!apiKey) {
    throw new Error(
      `${providerLabel(provider)} is not configured. Add ${
        provider === "xkiro" ? "XKIRO_API_KEY" : "OPENROUTER_API_KEY"
      } to your environment.`,
    );
  }

  const url = provider === "xkiro" ? XKIRO_URL : OPENROUTER_URL;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    headers["X-Title"] = "Barre AI";
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    let detail = `${providerLabel(provider)} error (${response.status})`;
    try {
      const data = (await response.json()) as {
        error?: { message?: string };
      };
      if (data.error?.message) detail = data.error.message;
    } catch {
      // ignore parse errors
    }

    if (response.status === 401) {
      throw new Error(`Invalid ${providerLabel(provider)} API key`);
    }
    if (response.status === 429) {
      throw new Error(
        `Rate limited by ${providerLabel(provider)}. Try again shortly.`,
      );
    }
    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error(`${providerLabel(provider)} returned an empty stream`);
  }

  return response.body;
}

/** @deprecated Use createChatStream */
export async function createOpenRouterStream(options: {
  messages: OpenRouterMessage[];
  model: string;
  signal?: AbortSignal;
}) {
  return createChatStream(options);
}

function extractDeltaContent(data: string): string | null {
  if (!data || data === "[DONE]") return null;

  try {
    const parsed = JSON.parse(data) as {
      choices?: Array<{
        delta?: { content?: string | null };
        message?: { content?: string | null };
      }>;
      error?: { message?: string };
    };

    if (parsed.error?.message) {
      throw new Error(parsed.error.message);
    }

    const choice = parsed.choices?.[0];
    const delta = choice?.delta?.content;
    if (typeof delta === "string" && delta.length > 0) return delta;

    const message = choice?.message?.content;
    if (typeof message === "string" && message.length > 0) return message;

    return null;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

/** Convert OpenAI-compatible SSE bytes into plain text deltas. */
export function openRouterSseToTextStream(
  upstream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const flushLines = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    chunk: string,
    { final }: { final: boolean },
  ) => {
    buffer += chunk;
    const parts = buffer.split(/\r?\n/);
    buffer = final ? "" : (parts.pop() ?? "");

    for (const rawLine of parts) {
      const line = rawLine.trim();
      if (!line || line.startsWith(":")) continue;
      if (!line.startsWith("data:")) continue;

      const content = extractDeltaContent(line.slice(5).trim());
      if (content) {
        controller.enqueue(encoder.encode(content));
      }
    }

    if (final && buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith("data:")) {
        const content = extractDeltaContent(line.slice(5).trim());
        if (content) controller.enqueue(encoder.encode(content));
      }
      buffer = "";
    }
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            flushLines(controller, decoder.decode(), { final: true });
            controller.close();
            break;
          }
          flushLines(controller, decoder.decode(value, { stream: true }), {
            final: false,
          });
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
    cancel() {
      upstream.cancel().catch(() => undefined);
    },
  });
}
