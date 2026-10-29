import { z } from "zod";

export type ChatProvider = "openrouter" | "xkiro";

export const MODEL_CATALOG = [
  {
    id: "mistralai/ministral-14b",
    label: "Ministral 14B (Somali)",
    provider: "xkiro",
  },
  {
    id: "qwen/qwen3.5-flash:free",
    label: "Qwen 3.5 Flash",
    provider: "xkiro",
  },
  {
    id: "openai/gpt-5.6-luna",
    label: "GPT 5.6 Luna (paid)",
    provider: "xkiro",
  },
  {
    id: "anthropic/claude-haiku-5.5",
    label: "Claude Haiku 5.5 (paid)",
    provider: "xkiro",
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    label: "Nemotron Lightning",
    provider: "openrouter",
  },
  {
    id: "openrouter/free",
    label: "OpenRouter Free",
    provider: "openrouter",
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    label: "Gemma 4 Free",
    provider: "openrouter",
  },
  {
    id: "poolside/laguna-xs-2.1:free",
    label: "Laguna XS Free",
    provider: "openrouter",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  provider: ChatProvider;
}>;

export const ALLOWED_MODELS = MODEL_CATALOG.map((m) => m.id) as unknown as [
  (typeof MODEL_CATALOG)[number]["id"],
  ...(typeof MODEL_CATALOG)[number]["id"][],
];

/** Default: xKiro Ministral — free + works with Somali prompt. */
export const DEFAULT_MODEL = "mistralai/ministral-14b" as const;

export function getModelProvider(model: string): ChatProvider {
  const found = MODEL_CATALOG.find((m) => m.id === model);
  return found?.provider ?? "openrouter";
}

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(20_000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  model: z.enum(ALLOWED_MODELS).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
