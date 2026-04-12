/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import PokemonCard from "@/components/PokemonCard";

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ""} />,
}));

describe("PokemonCard regression checks", () => {
  it("does not trigger fallback network fetches for card data", () => {
    const hadFetch = typeof global.fetch === "function";
    if (!hadFetch) {
      (global as typeof globalThis & { fetch: typeof fetch }).fetch = jest.fn() as unknown as typeof fetch;
    }
    const fetchSpy = jest.spyOn(global, "fetch");

    render(
      <PokemonCard
        pokemonOverview={{
          name: "bulbasaur",
          url: "https://pokeapi.co/api/v2/pokemon/1/",
        }}
      />
    );

    expect(screen.getByText("BULBASAUR")).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    if (!hadFetch) {
      delete (global as Partial<typeof globalThis>).fetch;
    }
  });
});
