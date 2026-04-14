import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ApiClient, PokemonApiClient, chatApi } from "@/lib/api_clients/pokemonApiClient";
import type { ChatMessage } from "@/types/interfaces";

function makeJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: async () => body,
  } as unknown as Response;
}

function makeEventStreamResponse(): Response {
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "text/event-stream" : null),
    },
    json: async () => ({ ignored: true }),
  } as unknown as Response;
}

describe("api client request layer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends GET requests with merged headers and no JSON body", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({ success: true, data: [] })
    );

    await ApiClient.get("/pokemons/get-all", {
      headers: { "x-test-header": "1" },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/pokemons/get-all",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-test-header": "1",
        }),
      })
    );
    const [, config] = fetchSpy.mock.calls[0] ?? [];
    expect((config as RequestInit).body).toBeUndefined();
  });

  it("sends POST requests with serialized JSON body", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(makeJsonResponse({ success: true }));

    await ApiClient.post("/pokemons/custom-page", { offset: 24, limit: 24 });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/pokemons/custom-page",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ offset: 24, limit: 24 }),
      })
    );
  });

  it("throws with API error payload when non-2xx response returns JSON error", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      makeJsonResponse({ error: "custom-api-error" }, 500)
    );

    await expect(ApiClient.get("/failing-endpoint")).rejects.toThrow("custom-api-error");
  });

  it("throws with status fallback when non-2xx error response has invalid JSON body", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => "application/json" },
      json: async () => {
        throw new Error("bad json");
      },
    } as unknown as Response);

    await expect(ApiClient.get("/failing-endpoint")).rejects.toThrow("HTTP error! status: 503");
  });

  it("returns raw response for event-stream responses", async () => {
    const streamResponse = makeEventStreamResponse();
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(streamResponse);

    const result = await ApiClient.post<Response>("/assistance", { chatHistory: [] });

    expect(fetchSpy).toHaveBeenCalled();
    expect(result).toBe(streamResponse);
  });
});

describe("pokemon API client wrappers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("wraps getPokemonByName success and error paths", async () => {
    const getSpy = jest.spyOn(ApiClient, "get");
    getSpy.mockResolvedValueOnce({ success: true, data: { name: "pikachu" } });
    getSpy.mockRejectedValueOnce(new Error("boom"));

    await expect(PokemonApiClient.getPokemonByName("pikachu")).resolves.toEqual({
      success: true,
      data: { name: "pikachu" },
    });
    await expect(PokemonApiClient.getPokemonByName("pikachu")).resolves.toEqual({
      success: false,
      error: "boom",
    });
  });

  it("builds type endpoint correctly and wraps errors", async () => {
    const getSpy = jest.spyOn(ApiClient, "get");
    getSpy.mockResolvedValueOnce({ success: true, data: [{ name: "bulbasaur" }] });
    getSpy.mockRejectedValueOnce(new Error("type error"));

    await PokemonApiClient.getPokemonsByType("grass");
    expect(getSpy).toHaveBeenNthCalledWith(1, "/pokemons/get-by-type/grass");

    await expect(PokemonApiClient.getPokemonsByType("grass")).resolves.toEqual({
      success: false,
      error: "type error",
    });
  });

  it("builds get-all endpoint with query and limit params", async () => {
    const getSpy = jest.spyOn(ApiClient, "get").mockResolvedValue({ success: true, data: [] });

    await PokemonApiClient.getAllPokemons({ query: "  pika  ", limit: 10 });
    expect(getSpy).toHaveBeenLastCalledWith("/pokemons/get-all?query=pika&limit=10", {
      signal: undefined,
    });

    await PokemonApiClient.getAllPokemons({ query: "   " });
    expect(getSpy).toHaveBeenLastCalledWith("/pokemons/get-all", { signal: undefined });
  });

  it("returns wrapped error when get-all call fails", async () => {
    jest.spyOn(ApiClient, "get").mockRejectedValue(new Error("all failed"));
    await expect(PokemonApiClient.getAllPokemons()).resolves.toEqual({
      success: false,
      error: "all failed",
    });
  });

  it("covers page/list/detail wrapper endpoints", async () => {
    const getSpy = jest.spyOn(ApiClient, "get").mockResolvedValue({ success: true, data: [] });
    const postSpy = jest.spyOn(ApiClient, "post").mockResolvedValue({ success: true, data: [] });

    await PokemonApiClient.getPokemonsFirstPage();
    await PokemonApiClient.getPokemonsLastPage("48");
    await PokemonApiClient.getRandomPokemon();
    await PokemonApiClient.getPokemonEvolutionChain("eevee");
    await PokemonApiClient.getEnrichedPokemonById(25, true);
    await PokemonApiClient.getEnrichedPokemonById(25, false);
    await PokemonApiClient.getPokemonsCustomPage(24, 12);

    expect(getSpy).toHaveBeenCalledWith("/pokemons/first-page");
    expect(getSpy).toHaveBeenCalledWith("/pokemons/last-page/48");
    expect(getSpy).toHaveBeenCalledWith("/pokemons/random");
    expect(getSpy).toHaveBeenCalledWith("/pokemons/evolution-chain/eevee");
    expect(getSpy).toHaveBeenCalledWith("/pokemons/enriched/25?includeEncounters=true");
    expect(getSpy).toHaveBeenCalledWith("/pokemons/enriched/25");
    expect(postSpy).toHaveBeenCalledWith("/pokemons/custom-page", { offset: 24, limit: 12 });
  });

  it("returns wrapped errors for remaining wrapper methods", async () => {
    jest.spyOn(ApiClient, "get").mockRejectedValue(new Error("get failed"));
    jest.spyOn(ApiClient, "post").mockRejectedValue(new Error("post failed"));

    await expect(PokemonApiClient.getPokemonsFirstPage()).resolves.toEqual({
      success: false,
      error: "get failed",
    });
    await expect(PokemonApiClient.getPokemonsLastPage("1")).resolves.toEqual({
      success: false,
      error: "get failed",
    });
    await expect(PokemonApiClient.getRandomPokemon()).resolves.toEqual({
      success: false,
      error: "get failed",
    });
    await expect(PokemonApiClient.getPokemonEvolutionChain("mew")).resolves.toEqual({
      success: false,
      error: "get failed",
    });
    await expect(PokemonApiClient.getEnrichedPokemonById(1)).resolves.toEqual({
      success: false,
      error: "get failed",
    });
    await expect(PokemonApiClient.getPokemonsCustomPage(0)).resolves.toEqual({
      success: false,
      error: "post failed",
    });
  });

  it("chat API forwards payloads to ApiClient.post", async () => {
    const postSpy = jest.spyOn(ApiClient, "post").mockResolvedValue(makeEventStreamResponse());
    const signal = new AbortController().signal;
    const chatHistory: ChatMessage[] = [{ role: "user", content: "hello" }];

    await chatApi.assistant(chatHistory, signal);
    await chatApi.roleplay("hey", "pikachu", chatHistory, signal);

    expect(postSpy).toHaveBeenNthCalledWith(
      1,
      "/assistance",
      { chatHistory },
      { signal }
    );
    expect(postSpy).toHaveBeenNthCalledWith(
      2,
      "/chat-roleplay",
      { message: "hey", pokemon: "pikachu", chatHistory },
      { signal }
    );
  });
});
