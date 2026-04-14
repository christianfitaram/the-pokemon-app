import { NextRequest } from "next/server";
import { describe, expect, it, jest } from "@jest/globals";

async function loadRouteWithRepositoryMock() {
  jest.resetModules();

  const repositoryModule = await import("@/lib/repositories/PokemonRepository");
  const getAllSpy = jest.spyOn(repositoryModule.PokemonRepository, "getAllPokemons").mockResolvedValue({
    count: 4,
    next: null,
    previous: null,
    results: [
      { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" },
      { name: "pichu", url: "https://pokeapi.co/api/v2/pokemon/172/" },
      { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
      { name: "raichu", url: "https://pokeapi.co/api/v2/pokemon/26/" },
    ],
  });

  const routeModule = await import("@/app/api/pokemons/get-all/route");
  return { GET: routeModule.GET, getAllSpy };
}

describe("/api/pokemons/get-all cache behavior", () => {
  it("reuses cached full list across requests inside TTL", async () => {
    const { GET, getAllSpy } = await loadRouteWithRepositoryMock();

    const req1 = new NextRequest("http://localhost:3000/api/pokemons/get-all?query=pi&limit=10");
    const res1 = await GET(req1);
    const body1 = await res1.json();

    const req2 = new NextRequest("http://localhost:3000/api/pokemons/get-all?query=rai&limit=10");
    const res2 = await GET(req2);
    const body2 = await res2.json();

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(getAllSpy).toHaveBeenCalledTimes(1);
    expect(body1.success).toBe(true);
    expect(body1.data.map((pokemon: { name: string }) => pokemon.name)).toEqual(["pikachu", "pichu"]);
    expect(body2.success).toBe(true);
    expect(body2.data.map((pokemon: { name: string }) => pokemon.name)).toEqual(["raichu"]);
  });
});
