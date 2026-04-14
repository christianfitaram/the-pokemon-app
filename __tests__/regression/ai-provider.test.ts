import { afterEach, describe, expect, it, jest } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };

async function loadProvider(env: Record<string, string | undefined>) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const openAIConstructor = jest.fn((config: unknown) => ({ config }));
  jest.doMock("openai", () => ({
    __esModule: true,
    default: openAIConstructor,
  }));

  const provider = await import("@/lib/ai/provider");
  return { ...provider, openAIConstructor };
}

describe("ai provider configuration", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.clearAllMocks();
  });

  it("builds an OpenAI client when provider resolves to openai", async () => {
    const { getAIClient, openAIConstructor } = await loadProvider({
      AI_PROVIDER: "openai",
      OPENAI_API_KEY: "openai-key",
      GEMINI_API_KEY: undefined,
    });

    const client = getAIClient();

    expect(client).toBeDefined();
    expect(openAIConstructor).toHaveBeenCalledWith({ apiKey: "openai-key" });
  });

  it("builds a Gemini-compatible client with baseURL when provider resolves to gemini", async () => {
    const { getAIClient, openAIConstructor } = await loadProvider({
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: "gemini-key",
      OPENAI_API_KEY: "openai-key",
    });

    const client = getAIClient();

    expect(client).toBeDefined();
    expect(openAIConstructor).toHaveBeenCalledWith({
      apiKey: "gemini-key",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  });

  it("falls back to gemini provider when AI_PROVIDER is invalid but GEMINI_API_KEY is set", async () => {
    const { getChatModel } = await loadProvider({
      AI_PROVIDER: "something-else",
      GEMINI_API_KEY: "gemini-key",
      OPENAI_API_KEY: "openai-key",
      AI_CHAT_MODEL: undefined,
    });

    expect(getChatModel()).toBe("gemini-2.5-flash");
  });

  it("throws when resolved gemini provider has no key configured", async () => {
    const { getAIClient } = await loadProvider({
      AI_PROVIDER: "gemini",
      GEMINI_API_KEY: undefined,
      OPENAI_API_KEY: "openai-key",
    });

    expect(() => getAIClient()).toThrow("GEMINI_API_KEY is not configured");
  });

  it("throws when resolved openai provider has no key configured", async () => {
    const { getAIClient } = await loadProvider({
      AI_PROVIDER: "openai",
      OPENAI_API_KEY: undefined,
      GEMINI_API_KEY: undefined,
    });

    expect(() => getAIClient()).toThrow("OPENAI_API_KEY is not configured");
  });

  it("returns configured chat model when AI_CHAT_MODEL is set", async () => {
    const { getChatModel } = await loadProvider({
      AI_PROVIDER: "openai",
      AI_CHAT_MODEL: "my-custom-chat-model",
    });

    expect(getChatModel()).toBe("my-custom-chat-model");
  });

  it("returns deduplicated Gemini chat model candidates and trims configured model", async () => {
    const { getChatModelCandidates } = await loadProvider({
      AI_PROVIDER: "gemini",
      AI_CHAT_MODEL: " gemini-2.5-flash ",
    });

    const candidates = getChatModelCandidates();

    expect(candidates[0]).toBe("gemini-2.5-flash");
    expect(new Set(candidates).size).toBe(candidates.length);
    expect(candidates).toContain("gemini-2.5-pro");
    expect(candidates).toContain("gemini-2.0-flash-lite");
  });

  it("returns openai chat model candidate default when no configured value exists", async () => {
    const { getChatModelCandidates } = await loadProvider({
      AI_PROVIDER: "openai",
      AI_CHAT_MODEL: undefined,
    });

    expect(getChatModelCandidates()).toEqual(["gpt-4o-mini"]);
  });

  it("returns configured embedding model when AI_EMBEDDING_MODEL is set", async () => {
    const { getEmbeddingModel } = await loadProvider({
      AI_PROVIDER: "openai",
      AI_EMBEDDING_MODEL: "my-embedding-model",
    });

    expect(getEmbeddingModel()).toBe("my-embedding-model");
  });

  it("returns gemini/openai embedding defaults and candidate lists", async () => {
    const gemini = await loadProvider({
      AI_PROVIDER: "gemini",
      AI_EMBEDDING_MODEL: " gemini-embedding-001 ",
    });
    expect(gemini.getEmbeddingModel()).toBe(" gemini-embedding-001 ");
    const geminiCandidates = gemini.getEmbeddingModelCandidates();
    expect(geminiCandidates).toContain("gemini-embedding-001");
    expect(geminiCandidates).toContain("text-embedding-004");
    expect(new Set(geminiCandidates).size).toBe(geminiCandidates.length);

    const openai = await loadProvider({
      AI_PROVIDER: "openai",
      AI_EMBEDDING_MODEL: undefined,
    });
    expect(openai.getEmbeddingModel()).toBe("text-embedding-3-small");
    expect(openai.getEmbeddingModelCandidates()).toEqual(["text-embedding-3-small"]);
  });
});
