import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local.");
  }

  client = new OpenAI({ apiKey });
  return client;
}

export function getModelName(): string {
  return process.env.OPENAI_MODEL ?? "gpt-5-mini";
}

export function getReasoningEffort(): "low" | "medium" | "high" {
  const value = process.env.OPENAI_REASONING_EFFORT?.toLowerCase();
  if (value === "medium" || value === "high") return value;
  return "low";
}
