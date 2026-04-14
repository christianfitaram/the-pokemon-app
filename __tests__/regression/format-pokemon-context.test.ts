import { describe, expect, it } from "@jest/globals";
import formatPokemonForContext from "@/utils/formatPokemonForContextAPI";

describe("formatPokemonForContext", () => {
  it("formats mixed payload shapes with normalized abilities/stats and evolution data", () => {
    const output = formatPokemonForContext({
      name: "charizard",
      height_dm: 17,
      weight_hg: 905,
      types: ["fire", "flying"],
      abilities: [
        "blaze",
        { name: "solar-power" },
        { ability: { name: "tough-claws" } },
        { unexpected: "ignored" },
      ],
      stats: [
        { name: "speed", value: 100 },
        { stat: { name: "special-attack" }, base_stat: 109 },
        { stat: { name: "bad-stat" }, base_stat: Number.NaN },
      ],
      color: "red",
      habitat: "mountain",
      description: "Spits fire that is hot enough to melt boulders.",
      image: "https://img.example/charizard.png",
      evolution_chain: ["charmander", "charmeleon", "charizard"],
      evolution_tree: {
        name: "charmander",
        evolves_to: [
          {
            name: "charmeleon",
            evolves_to: [{ name: "charizard" }],
          },
        ],
      },
    });

    expect(output).toContain("Name: charizard");
    expect(output).toContain("Height: 1.7 m");
    expect(output).toContain("Weight: 90.5 kg");
    expect(output).toContain("Types: fire, flying");
    expect(output).toContain("Abilities: blaze, solar-power, tough-claws");
    expect(output).toContain("Stats: speed: 100, special-attack: 109");
    expect(output).toContain("Evolution Chain: charmander -> charmeleon -> charizard");
    expect(output).toContain("Evolution Tree:");
    expect(output).toContain("- charmander");
    expect(output).toContain("  - charmeleon");
    expect(output).toContain("    - charizard");
  });

  it("falls back to unknown/default values for invalid payload fields", () => {
    const output = formatPokemonForContext({
      name: "",
      height_dm: undefined,
      weight_hg: undefined,
      types: "not-an-array",
      abilities: "not-an-array",
      stats: { hp: 45, attack: 49 },
      color: "",
      habitat: null,
      description: "",
      image: "",
    });

    expect(output).toContain("Name: unknown");
    expect(output).toContain("Height: unknown");
    expect(output).toContain("Weight: unknown");
    expect(output).toContain("Types:");
    expect(output).toContain("Abilities:");
    expect(output).toContain("Color: unknown");
    expect(output).toContain("Habitat: unknown");
    expect(output).toContain("Description: unknown");
    expect(output).toContain("Image URL: unknown");
    expect(output).toContain("Stats: hp: 45, attack: 49");
  });

  it("handles non-object input safely", () => {
    const output = formatPokemonForContext(null);

    expect(output).toContain("Name: unknown");
    expect(output).toContain("Stats:");
  });
});
