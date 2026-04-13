import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GET } from "@/app/api/pokemons/random/route";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

describe("random route regression checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("calls random selection once and returns wrapped error payload", async () => {
    const randomSpy = jest.spyOn(PokemonRepository, "getRandomPokemon").mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(randomSpy).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe("boom");
  });

  it("returns wrapped success payload", async () => {
    jest.spyOn(PokemonRepository, "getRandomPokemon").mockResolvedValue({
      name: "pikachu",
      id: 25,
    } as unknown as Awaited<ReturnType<typeof PokemonRepository.getRandomPokemon>>);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: { name: "pikachu", id: 25 },
    });
  });
});
