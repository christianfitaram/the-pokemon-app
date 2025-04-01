export interface Pokemon {
  name: string;
  url: string;
  viewedAt?: number;
}
export interface PokemonTypeResponse {
  pokemon: {
    pokemon: Pokemon;
    slot: number;
  }[];
}
export interface Response {
  count: number;
  next: string;
  previous: string | null;
  results: Pokemon[];
}
export interface PokemonType {
  type: {
    name: string;
  };
}

export interface PokemonSprites {
  front_default: string;
  front_shiny: string;
  other: {
    "official-artwork": {
      front_default: string;
      front_shiny: string;
    };
  };
}

export interface PokemonDetails {
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonType[];
  sprites: PokemonSprites;
}

export interface PokemonDetailsRandom {
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonType[];
  sprites: PokemonSprites;
  url: string;
}

export interface PokemonsToDisplayProps {
  pokemons: Pokemon[];
  prevtUrl: string;
  nextUrl: string | null;
  lastUrl: string;
  loading: boolean;
  fetchPokemon: (url: string) => void;
}

export interface ToDisplayProps {
  value: Pokemon[];
  onChange: (newValue: Pokemon[]) => void;
  isSearchOn: boolean;
  setisSearchOn: (newValue: boolean) => void;
  isUserChating: boolean;
  setIsUserChatting: (newValue: boolean) => void;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantChatProps {
  isUserChating: boolean;
  setIsUserChatting: (value: boolean) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}
