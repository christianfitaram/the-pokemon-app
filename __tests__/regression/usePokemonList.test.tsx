/** @jest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { usePokemonList } from "@/hooks/usePokemonList";
import { PokemonApiClient } from "@/lib/api_clients/pokemonApiClient";

describe("usePokemonList regression checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not auto-fetch on mount", () => {
    const firstPageSpy = jest.spyOn(PokemonApiClient, "getPokemonsFirstPage");
    const customPageSpy = jest.spyOn(PokemonApiClient, "getPokemonsCustomPage");

    renderHook(() =>
      usePokemonList({
        initialValue: [],
        onChange: jest.fn(),
      })
    );

    expect(firstPageSpy).not.toHaveBeenCalled();
    expect(customPageSpy).not.toHaveBeenCalled();
  });

  it("fetches first page only when explicitly requested", async () => {
    const onChange = jest.fn();
    const pagePayload = {
      count: 1302,
      next: null,
      previous: null,
      results: [{ name: "bulbasaur", id: 1 }],
    };
    const firstPageSpy = jest.spyOn(PokemonApiClient, "getPokemonsFirstPage").mockResolvedValue({
      success: true,
      data: pagePayload,
    });

    const { result } = renderHook(() =>
      usePokemonList({
        initialValue: [],
        onChange,
      })
    );

    await act(async () => {
      await result.current.fetchPokemon(undefined, true);
    });

    expect(firstPageSpy).toHaveBeenCalledTimes(1);
    expect(result.current.count).toBe(1302);
    expect(result.current.pokemonList).toEqual(pagePayload.results);
    expect(onChange).toHaveBeenCalledWith(pagePayload.results);
  });
});
