import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

describe("PokemonRepository memory-cache cap", () => {
  beforeEach(() => {
    PokemonRepository.clearMemoryCacheForTests();
    jest.restoreAllMocks();
  });

  it("does not grow beyond configured maximum size", () => {
    const repositoryWithPrivateAccess = PokemonRepository as unknown as {
      setCachedData: (key: string, data: unknown) => void;
    };
    for (let i = 0; i < 550; i++) {
      repositoryWithPrivateAccess.setCachedData(`cache-key-${i}`, { index: i });
    }

    expect(PokemonRepository.getMemoryCacheSizeForTests()).toBeLessThanOrEqual(500);
  });
});
