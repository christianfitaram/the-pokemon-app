import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type RedisLike = {
  get: jest.Mock;
  set: jest.Mock;
};

type PokemonRepositoryType = {
  fetchWithErrorHandling: (url: string, retries?: number, delay?: number) => Promise<unknown>;
  clearMemoryCacheForTests: () => void;
};

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as Response;
}

async function loadRepositoryWithRedis(redisClient: RedisLike | null): Promise<PokemonRepositoryType> {
  jest.resetModules();
  jest.doMock("@/lib/redis", () => ({
    __esModule: true,
    default: {},
    connectRedis: jest.fn(async () => redisClient),
  }));

  const repositoryModule = await import("@/lib/repositories/PokemonRepository");
  return repositoryModule.PokemonRepository as unknown as PokemonRepositoryType;
}

describe("PokemonRepository Redis fallback behavior", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns origin data when Redis is unavailable", async () => {
    const payload = {
      count: 1,
      next: null,
      previous: null,
      results: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
    };

    const PokemonRepository = await loadRepositoryWithRedis(null);
    PokemonRepository.clearMemoryCacheForTests();

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(mockResponse(payload));

    const data = await PokemonRepository.fetchWithErrorHandling(
      "https://pokeapi.co/api/v2/pokemon?limit=1",
      0
    );

    expect(data).toEqual(payload);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("ignores Redis read/write errors and still serves origin data", async () => {
    const payload = {
      id: 25,
      name: "pikachu",
      height: 4,
      weight: 60,
      base_experience: 112,
      types: [],
      sprites: { front_default: null, other: { "official-artwork": { front_default: null } } },
      stats: [],
    };

    const redisClient: RedisLike = {
      get: jest.fn(async () => {
        throw new Error("redis read failed");
      }),
      set: jest.fn(async () => {
        throw new Error("redis write failed");
      }),
    };

    const PokemonRepository = await loadRepositoryWithRedis(redisClient);
    PokemonRepository.clearMemoryCacheForTests();

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(mockResponse(payload));

    const data = await PokemonRepository.fetchWithErrorHandling(
      "https://pokeapi.co/api/v2/pokemon/pikachu",
      0
    );

    expect(data).toEqual(payload);
    expect(redisClient.get).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
