/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import { describe, expect, it } from "@jest/globals";
import { useState } from "react";
import { SearchInput } from "@/components/search/SearchInput";
import type { Pokemon } from "@/types/interfaces";

const suggestions: Pokemon[] = [
  { name: "pikachu", url: "https://pokeapi.co/api/v2/pokemon/25/" },
  { name: "pichu", url: "https://pokeapi.co/api/v2/pokemon/172/" },
];

function SearchInputHarness({ noMatchesMessage = null }: { noMatchesMessage?: string | null }) {
  const [searchQuery, setSearchQuery] = useState("pi");
  const [showDropdown, setShowDropdown] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(noMatchesMessage);

  return (
    <SearchInput
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      showDropdown={showDropdown}
      setShowDropdown={setShowDropdown}
      highlightedIndex={highlightedIndex}
      setHighlightedIndex={setHighlightedIndex}
      noMatchesMessage={feedback}
      setNoMatchesMessage={setFeedback}
      filteredDropdown={feedback ? [] : suggestions}
      onClear={() => {
        setSearchQuery("");
        setShowDropdown(false);
        setHighlightedIndex(0);
        setFeedback(null);
      }}
      handleDropdownSelect={(pokemon) => {
        setSearchQuery(pokemon.name);
        setShowDropdown(false);
      }}
    />
  );
}

describe("SearchInput accessibility", () => {
  it("exposes combobox/listbox semantics and active option state", () => {
    render(<SearchInputHarness />);

    const input = screen.getByTestId("search-input");
    const listbox = screen.getByRole("listbox", { name: "Pokemon suggestions" });

    expect(input).toHaveAttribute("role", "combobox");
    expect(input).toHaveAttribute("aria-controls", "pokemon-search-listbox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-activedescendant", "dropdown-item-0");
    expect(listbox).toHaveAttribute("id", "pokemon-search-listbox");

    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(input).toHaveAttribute("aria-activedescendant", "dropdown-item-1");
    const selectedOption = screen.getByRole("option", { selected: true });
    expect(selectedOption).toHaveAttribute("id", "dropdown-item-1");
  });

  it("announces no-results feedback with status semantics", () => {
    render(<SearchInputHarness noMatchesMessage="No Pokémon found with that name" />);

    const feedback = screen.getByRole("status");
    expect(feedback).toHaveAttribute("id", "pokemon-search-feedback");
    expect(feedback).toHaveTextContent("No Pokémon found with that name");
  });
});
