/** @jest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useAllPokemonNames } from "@/hooks/useAllPokemonNames";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

describe("useAllPokemonNames cache behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not call API when query is below minimum length", () => {
    const apiSpy = jest.spyOn(PokemonApiClient, "getAllPokemons");

    renderHook(() => useAllPokemonNames("p"));

    expect(apiSpy).not.toHaveBeenCalled();
  });

  it("reuses cached results for repeated normalized queries", async () => {
    const apiSpy = jest.spyOn(PokemonApiClient, "getAllPokemons").mockResolvedValue({
      success: true,
      data: [{ name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" }],
    });

    const { result, rerender } = renderHook(
      ({ query }) => useAllPokemonNames(query),
      { initialProps: { query: "pi" } }
    );

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);
    expect(result.current.pokemonNames).toEqual([
      { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" },
    ]);

    rerender({ query: "PI" });

    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);
    expect(result.current.pokemonNames).toEqual([
      { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" },
    ]);
  });
});
