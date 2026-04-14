import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

type MockAiClient = {
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

const pokemonSummary = {
  name: "pikachu",
  height: 4,
  weight: 60,
  types: [{ type: { name: "electric" } }],
  abilities: [{ ability: { name: "static" } }],
  stats: [{ stat: { name: "speed" }, base_stat: 90 }],
};

const speciesPayload = {
  base_happiness: 70,
  color: { name: "yellow" },
};

async function loadRoleplayRoute(options: {
  aiClient?: MockAiClient;
  chatModelCandidates?: string[];
  poolQueryImpl?: (...args: unknown[]) => Promise<{ rows: unknown[] }>;
  pokemonByNameImpl?: (name: string) => Promise<unknown>;
  fetchWithErrorHandlingImpl?: (url: string) => Promise<unknown>;
}) {
  jest.resetModules();

  const defaultAiClient: MockAiClient = options.aiClient ?? {
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
      return {
        rows: [
          {
            habitat: "forest",
            description: "An electric mouse pokemon",
            evolution_chain: ["pichu", "pikachu", "raichu"],
            evolution_tree: { name: "pikachu", evolves_to: [{ name: "raichu" }] },
          },
        ],
      };
    }),
  };

  const PokemonRepository = {
    getPokemonByName: jest.fn(async (name: string) => {
      if (options.pokemonByNameImpl) {
        return options.pokemonByNameImpl(name);
      }
      return pokemonSummary;
    }),
    fetchWithErrorHandling: jest.fn(async (url: string) => {
      if (options.fetchWithErrorHandlingImpl) {
        return options.fetchWithErrorHandlingImpl(url);
      }
      return speciesPayload;
    }),
  };

  jest.doMock("@/lib/ai/provider", () => ({
    getAIClient: jest.fn(() => defaultAiClient),
    getChatModelCandidates: jest.fn(() => options.chatModelCandidates ?? ["roleplay-model"]),
  }));

  jest.doMock("@/lib/db/pgvector", () => ({ pool }));
  jest.doMock("@/lib/repositories/PokemonRepository", () => ({ PokemonRepository }));

  jest.doMock("@/lib/observability", () => ({
    elapsedMs: jest.fn(() => 1),
    incrementCounter: jest.fn(() => 1),
    logEvent: jest.fn(),
    observeDuration: jest.fn(),
    startTimer: jest.fn(() => 0),
  }));

  const routeModule = await import("@/app/api/chat-roleplay/route");
  return { POST: routeModule.POST, aiClient: defaultAiClient, pool, PokemonRepository };
}

describe("chat-roleplay route hardening", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for malformed JSON body", async () => {
    const { POST } = await loadRoleplayRoute({});

    const request = new NextRequest("http://localhost:3000/api/chat-roleplay", {
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

  it("falls back to next roleplay model candidate when first fails", async () => {
    const chatCreate = jest.fn() as jest.Mock;
    chatCreate.mockImplementationOnce(async () => {
      throw new Error("primary failed");
    });
    chatCreate.mockImplementationOnce(async () => makeDeltaStream("fallback-ok"));

    const aiClient: MockAiClient = {
      chat: {
        completions: {
          create: chatCreate as unknown as (...args: unknown[]) => Promise<unknown>,
        },
      },
    };

    const { POST } = await loadRoleplayRoute({
      aiClient,
      chatModelCandidates: ["bad-roleplay-model", "good-roleplay-model"],
    });

    const request = new NextRequest("http://localhost:3000/api/chat-roleplay", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "hello there",
        pokemon: "pikachu",
        chatHistory: [],
      }),
    });

    const response = await POST(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("fallback-ok");
    expect(aiClient.chat.completions.create as unknown as jest.Mock).toHaveBeenCalledTimes(2);
  });

  it("keeps serving when DB context lookup fails", async () => {
    let capturedMessages: ChatCompletionMessageParam[] = [];

    const aiClient: MockAiClient = {
      chat: {
        completions: {
          create: (jest.fn(async ({ messages }: { messages: ChatCompletionMessageParam[] }) => {
            capturedMessages = messages;
            return makeDeltaStream("context-fallback");
          }) as unknown) as (...args: unknown[]) => Promise<unknown>,
        },
      },
    };

    const { POST } = await loadRoleplayRoute({
      aiClient,
      poolQueryImpl: async () => {
        throw new Error("db unavailable");
      },
    });

    const request = new NextRequest("http://localhost:3000/api/chat-roleplay", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "hello there",
        pokemon: "pikachu",
        chatHistory: [],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const fallbackContextMessage = capturedMessages.find(
      (message) => message.role === "system" && String(message.content).includes("Pokemon context unavailable")
    );
    expect(fallbackContextMessage).toBeDefined();
  });

  it("returns 500 when all model candidates fail", async () => {
    const aiClient: MockAiClient = {
      chat: {
        completions: {
          create: (jest.fn(async () => {
            throw new Error("no models available");
          }) as unknown) as (...args: unknown[]) => Promise<unknown>,
        },
      },
    };

    const { POST } = await loadRoleplayRoute({
      aiClient,
      chatModelCandidates: ["m1", "m2"],
    });

    const request = new NextRequest("http://localhost:3000/api/chat-roleplay", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "hello there",
        pokemon: "pikachu",
        chatHistory: [],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Roleplay request failed" });
  });

  it("handles pre-aborted requests without consuming roleplay stream chunks", async () => {
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
      chat: {
        completions: {
          create: jest.fn(async () => stream) as unknown as (...args: unknown[]) => Promise<unknown>,
        },
      },
    };

    const { POST } = await loadRoleplayRoute({ aiClient });

    const controller = new AbortController();
    controller.abort();

    const request = new NextRequest("http://localhost:3000/api/chat-roleplay", {
      method: "POST",
      signal: controller.signal,
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "hello there",
        pokemon: "pikachu",
        chatHistory: [],
      }),
    });

    const response = await POST(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe("");
    expect(iterator.next).not.toHaveBeenCalled();
  });
});
