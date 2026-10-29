import { z } from "zod";

/** xKiro chat models shown in the composer. */
export const ALLOWED_MODELS = [
  "mistralai/ministral-14b",
  "qwen/qwen3.5-flash:free",
  "google/gemini-3.6-flash",
  "openai/gpt-5.6-luna",
  "anthropic/claude-haiku-5.5",
] as const;

export const DEFAULT_MODEL = "mistralai/ministral-14b";

export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(20_000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
  model: z.enum(ALLOWED_MODELS).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
