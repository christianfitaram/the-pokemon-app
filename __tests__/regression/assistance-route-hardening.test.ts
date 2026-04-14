import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type MockAiClient = {
  embeddings: {
    create: (...args: unknown[]) => Promise<unknown>;
  };
  chat: {
    completions: {
      create: (...args: unknown[]) => Promise<unknown>;
    };
  };
};

function makeDeltaStream(text: string) {
  return {
    async *[Symbol.asyncIterator]() {
      yield { choices: [{ delta: { content: text } }] };
    },
  };
}

async function loadAssistanceRoute(options: {
  aiClient?: MockAiClient;
  chatModelCandidates?: string[];
  embeddingModelCandidates?: string[];
  poolQueryImpl?: (...args: unknown[]) => Promise<{ rows: unknown[] }>;
}) {
  jest.resetModules();

  const defaultAiClient: MockAiClient = options.aiClient ?? {
    embeddings: {
      create: jest.fn(async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] })) as unknown as (...args: unknown[]) => Promise<unknown>,
    },
    chat: {
      completions: {
        create: jest.fn(async () => makeDeltaStream("ok")) as unknown as (...args: unknown[]) => Promise<unknown>,
      },
    },
  };

  const pool = {
    query: jest.fn(async (...args: unknown[]) => {
      if (options.poolQueryImpl) {
        return options.poolQueryImpl(...args);
      }
      return { rows: [] };
    }),
  };

  jest.doMock("@/lib/ai/provider", () => ({
    getAIClient: jest.fn(() => defaultAiClient),
    getChatModelCandidates: jest.fn(() => options.chatModelCandidates ?? ["test-model"]),
    getEmbeddingModelCandidates: jest.fn(() => options.embeddingModelCandidates ?? ["test-embedding"]),
  }));

  jest.doMock("@/lib/db/pgvector", () => ({ pool }));

  jest.doMock("@/utils/formatPokemonForContextAPI", () => ({
    __esModule: true,
    default: (payload: { name?: string }) => `Pokemon: ${payload?.name ?? "unknown"}`,
  }));

  jest.doMock("@/lib/observability", () => ({
    elapsedMs: jest.fn(() => 1),
    incrementCounter: jest.fn(() => 1),
    logEvent: jest.fn(),
    observeDuration: jest.fn(),
    startTimer: jest.fn(() => 0),
  }));

  const routeModule = await import("@/app/api/assistance/route");
  return { POST: routeModule.POST, pool, aiClient: defaultAiClient };
}

describe("assistance route hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for malformed JSON body", async () => {
    const { POST } = await loadAssistanceRoute({});

    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: "not-json",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid JSON body" });
  });

  it("falls back to next chat model candidate when the first fails", async () => {
    const chatCreate = jest.fn() as jest.Mock;
    chatCreate.mockImplementationOnce(async () => {
      throw new Error("model unavailable");
    });
    chatCreate.mockImplementationOnce(async () => makeDeltaStream("fallback-ok"));

    const aiClient: MockAiClient = {
      embeddings: {
        create: jest.fn(async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] })) as unknown as (...args: unknown[]) => Promise<unknown>,
      },
      chat: {
        completions: {
          create: chatCreate as unknown as (...args: unknown[]) => Promise<unknown>,
        },
      },
    };

    const { POST, pool } = await loadAssistanceRoute({
      aiClient,
      chatModelCandidates: ["bad-model", "good-model"],
      poolQueryImpl: async () => ({
        rows: [{ name: "charizard", types: ["fire"], height_dm: 17, weight_hg: 905 }],
      }),
    });

    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chatHistory: [{ role: "user", content: "show me red pokemon" }],
      }),
    });

    const response = await POST(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("fallback-ok");
    expect(aiClient.chat.completions.create as unknown as jest.Mock).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when DB retrieval fails", async () => {
    const { POST } = await loadAssistanceRoute({
      poolQueryImpl: async () => {
        throw new Error("db unavailable");
      },
    });

    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chatHistory: [{ role: "user", content: "show me red pokemon" }],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Assistant request failed" });
  });

  it("uses explicit no-match context when retrieval is empty", async () => {
    let capturedMessages: ChatCompletionMessageParam[] = [];

    const aiClient: MockAiClient = {
      embeddings: {
        create: jest.fn(async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] })) as unknown as (...args: unknown[]) => Promise<unknown>,
      },
      chat: {
        completions: {
          create: (jest.fn(async ({ messages }: { messages: ChatCompletionMessageParam[] }) => {
            capturedMessages = messages;
            return makeDeltaStream("empty");
          }) as unknown) as (...args: unknown[]) => Promise<unknown>,
        },
      },
    };

    const { POST } = await loadAssistanceRoute({
      aiClient,
      poolQueryImpl: async (...args: unknown[]) => {
        const sql = String(args[0] ?? "");
        if (sql.includes("vector_dims(embedding)")) {
          return { rows: [{ dim: 3 }] };
        }
        return { rows: [] };
      },
    });

    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chatHistory: [{ role: "user", content: "find me something impossible" }],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const noMatchSystemMessage = capturedMessages.find(
      (message) => message.role === "system" && String(message.content).includes("No matching Pokémon found.")
    );
    expect(noMatchSystemMessage).toBeDefined();
  });

  it("handles pre-aborted requests without consuming stream chunks", async () => {
    const iterator = {
      next: jest.fn(async () => ({
        done: false,
        value: { choices: [{ delta: { content: "should-not-be-read" } }] },
      })),
      return: jest.fn(async () => ({ done: true, value: undefined })),
    };

    const stream = {
      [Symbol.asyncIterator]: () => iterator,
    };

    const aiClient: MockAiClient = {
      embeddings: {
        create: jest.fn(async () => ({ data: [{ embedding: [0.1, 0.2, 0.3] }] })) as unknown as (...args: unknown[]) => Promise<unknown>,
      },
      chat: {
        completions: {
          create: jest.fn(async () => stream) as unknown as (...args: unknown[]) => Promise<unknown>,
        },
      },
    };

    const { POST } = await loadAssistanceRoute({
      aiClient,
      poolQueryImpl: async () => ({
        rows: [{ name: "charizard", types: ["fire"], height_dm: 17, weight_hg: 905 }],
      }),
    });

    const controller = new AbortController();
    controller.abort();

    const request = new NextRequest("http://localhost:3000/api/assistance", {
      method: "POST",
      signal: controller.signal,
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        chatHistory: [{ role: "user", content: "show me red pokemon" }],
      }),
    });

    const response = await POST(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe("");
    expect(iterator.next).not.toHaveBeenCalled();
  });
});
