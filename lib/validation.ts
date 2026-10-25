import { z } from "zod";

/** Currently available free OpenRouter models (verified via /api/v1/models). */
export const ALLOWED_MODELS = [
  "liquid/lfm-2.5-2.6b:free",
  "poolside/laguna-xs-2.1:free",
  "google/gemma-4-26b-a4b-it:free",
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
] as const;

export const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning:free";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(20_000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  model: z.enum(ALLOWED_MODELS).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
