import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { GET as firstPageGET } from "@/app/api/pokemons/first-page/route";
import { GET as getByTypeGET } from "@/app/api/pokemons/get-by-type/[type]/route";
import { POST as customPagePOST } from "@/app/api/pokemons/custom-page/route";
import { PokemonRepository } from "@/lib/repositories/PokemonRepository";

describe("pokemon API contract regression checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("first-page route returns { success, data }", async () => {
    jest.spyOn(PokemonRepository, "getPokemonsFirstPage").mockResolvedValue({
      count: 1302,
      next: null,
      previous: null,
      results: [{ name: "bulbasaur", id: 1 }],
    } as any);

    const response = await firstPageGET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.results).toHaveLength(1);
  });

  it("get-by-type route returns { success, data }", async () => {
    jest.spyOn(PokemonRepository, "getPokemonsByType").mockResolvedValue([
      { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
    ] as any);

    const response = await getByTypeGET(
      new NextRequest("http://localhost:3000/api/pokemons/get-by-type/grass"),
      { params: Promise.resolve({ type: "grass" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: [{ name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }],
    });
  });

  it("custom-page route returns wrapped validation errors", async () => {
    const request = new NextRequest("http://localhost:3000/api/pokemons/custom-page", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ offset: -1, limit: 24 }),
    });

    const response = await customPagePOST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: "Invalid offset provided",
    });
  });
});
