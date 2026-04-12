import OpenAI from "openai";

export type AIProvider = "openai" | "gemini";

function resolveProvider(): AIProvider {
  const configured = (process.env.AI_PROVIDER || "").toLowerCase();
  if (configured === "openai" || configured === "gemini") {
    return configured;
  }

  if (process.env.GEMINI_API_KEY) {
    return "gemini";
  }

  return "openai";
}

export function getAIClient() {
  const provider = resolveProvider();

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    return new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
}

export function getChatModel() {
  const provider = resolveProvider();
  if (process.env.AI_CHAT_MODEL) {
    return process.env.AI_CHAT_MODEL;
  }

  return provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini";
}

export function getChatModelCandidates() {
  const provider = resolveProvider();
  const configured = process.env.AI_CHAT_MODEL?.trim();

  if (provider === "gemini") {
    return [
      configured,
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash",
    ].filter((value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index);
  }

  return [configured || "gpt-4o-mini"];
}

export function getEmbeddingModel() {
  const provider = resolveProvider();
  if (process.env.AI_EMBEDDING_MODEL) {
    return process.env.AI_EMBEDDING_MODEL;
  }

  return provider === "gemini" ? "gemini-embedding-001" : "text-embedding-3-small";
}

export function getEmbeddingModelCandidates() {
  const provider = resolveProvider();
  const configured = process.env.AI_EMBEDDING_MODEL?.trim();

  if (provider === "gemini") {
    return [configured, "gemini-embedding-001", "text-embedding-004"].filter(
      (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index
    );
  }

  return [configured || "text-embedding-3-small"];
}
