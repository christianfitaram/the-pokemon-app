import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

type MockRedis = {
  get: jest.Mock;
  set: jest.Mock;
};

const mockRedis: MockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

const pokemonPayload = {
  id: 1,
  name: "bulbasaur",
  height: 7,
  weight: 69,
  base_experience: 64,
  types: [{ type: { name: "grass", url: "https://pokeapi.co/api/v2/type/12/" } }],
  sprites: {
    front_default: "https://img.poke/bulbasaur-front.png",
    other: {
      "official-artwork": {
        front_default: "https://img.poke/bulbasaur-art.png",
      },
    },
  },
  stats: [{ stat: { name: "hp", url: "https://pokeapi.co/api/v2/stat/1/" }, base_stat: 45, effort: 0 }],
  moves: [
    {
      move: { name: "tackle", url: "https://pokeapi.co/api/v2/move/33/" },
      version_group_details: [{ move_learn_method: { name: "level-up" }, level_learned_at: 1 }],
    },
  ],
  abilities: [
    {
      ability: { name: "overgrow", url: "https://pokeapi.co/api/v2/ability/65/" },
      is_hidden: false,
      slot: 1,
    },
  ],
};

const speciesPayload = {
  evolution_chain: { url: "https://pokeapi.co/api/v2/evolution-chain/1/" },
  genera: [{ genus: "Seed Pokemon", language: { name: "en" } }],
  flavor_text_entries: [{ flavor_text: "A strange seed was planted on its back at birth.", language: { name: "en" } }],
  habitat: { name: "grassland", url: "https://pokeapi.co/api/v2/pokemon-habitat/3/" },
  shape: { name: "quadruped", url: "https://pokeapi.co/api/v2/pokemon-shape/8/" },
  color: { name: "green" },
  capture_rate: 45,
  base_happiness: 50,
  growth_rate: { name: "medium-slow" },
  egg_groups: [{ name: "monster", url: "https://pokeapi.co/api/v2/egg-group/1/" }],
  gender_rate: 1,
  is_legendary: false,
  is_mythical: false,
};

const evolutionPayload = {
  chain: {
    species: { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon-species/1/" },
    evolves_to: [
      {
        species: { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon-species/2/" },
        evolution_details: [{ min_level: 16, trigger: { name: "level-up" } }],
        evolves_to: [],
      },
    ],
  },
};

const abilityPayload = {
  name: "overgrow",
  effect_entries: [
    {
      effect: "Powers up Grass-type moves when the Pokemon is in trouble.",
      short_effect: "Strengthens Grass moves to inflict 1.5x damage at 1/3 max HP or less.",
      language: { name: "en" },
    },
  ],
};

const encountersPayload = [
  {
    location_area: { name: "kanto-route-2-south-towards-viridian-city" },
    version_details: [{ version: { name: "red" } }, { version: { name: "blue" } }],
  },
];

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

async function loadRoute(mockRedis: MockRedis) {
  jest.resetModules();
  jest.doMock("@/lib/redis", () => ({
    connectRedis: jest.fn().mockResolvedValue(mockRedis),
  }));
  return import("@/app/api/pokemons/enriched/[id]/route");
}

describe("enriched route integration regression checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue("OK");

    jest.spyOn(global, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.endsWith("/pokemon/1")) return mockResponse(pokemonPayload);
      if (url.endsWith("/pokemon-species/1")) return mockResponse(speciesPayload);
      if (url.endsWith("/evolution-chain/1/")) return mockResponse(evolutionPayload);
      if (url.endsWith("/ability/65/")) return mockResponse(abilityPayload);
      if (url.endsWith("/pokemon/1/encounters")) return mockResponse(encountersPayload);

      return {
        ok: false,
        status: 404,
        json: async () => ({ message: "not found" }),
      } as Response;
    });
  });

  it("returns enriched payload without encounters by default", async () => {
    const { GET } = await loadRoute(mockRedis);
    const request = new NextRequest("http://localhost:3000/api/pokemons/enriched/1");
    const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("bulbasaur");
    expect(body.data.abilities).toHaveLength(1);
    expect(body.data.encounters).toBeUndefined();
  });

  it("returns enriched payload with encounters when includeEncounters=true", async () => {
    const { GET } = await loadRoute(mockRedis);
    const request = new NextRequest("http://localhost:3000/api/pokemons/enriched/1?includeEncounters=true");
    const response = await GET(request, { params: Promise.resolve({ id: "1" }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.meta.includeEncounters).toBe(true);
    expect(body.data.encounters).toHaveLength(1);
    expect(body.data.encounters[0].versions).toEqual(["red", "blue"]);
    expect(global.fetch).toHaveBeenCalledWith("https://pokeapi.co/api/v2/pokemon/1/encounters");
  });
});
