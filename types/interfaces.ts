import {ChatType} from "@/types/chatTypes";

export interface Pokemon {
    name: string;
    url?: string;
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
    next: string | null;
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
    error?: string;
    name: string;
    height: number;
    weight: number;
    base_experience: number;
    types: PokemonType[];
    sprites: PokemonSprites;
    url?: string;
}
export interface PokemonsToDisplayProps {
    pokemons: Pokemon[];
    prevUrl: string | null;
    nextUrl: string | null;
    loading: boolean;
    isSearchOn: boolean;
    fetchPokemon: (url: string | undefined, isInitial: boolean) => void;
    fetchLastPage: () => void;
}

export interface SearchProps extends ToDisplayProps {
    setIsSearchOn: (val: boolean) => void;
    setIsUserChatting: (val: boolean) => void;
    setTypeLoading: (val: boolean) => void;
    fetchPokemonRef: React.MutableRefObject<
        ((url?: string, isInitial?: boolean) => void) | null
    >;
}

export interface ToDisplayProps {
    value: Pokemon[];
    onChange: (newValue: Pokemon[]) => void;
    isSearchOn: boolean;
    setIsSearchOn: (newValue: boolean) => void;
    isUserChatting: boolean;
    setIsUserChatting: (newValue: boolean) => void;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export interface AssistantChatProps {
    isUserChatting: boolean;
    setIsUserChatting: (value: boolean) => void;
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface SelectMenuProps {
    handleTypeSelect: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    selectedType: string | undefined;
}

export interface LinkCardProps {
    url: string;
    children: React.ReactNode;
}

export interface EvolutionCardProps {
    types: PokemonType[];
}

export interface PokemonCardProps {
    pokemonOverview: Pokemon;
    isActive?: boolean
}

export interface ChildrenAsProp {
    children: React.ReactNode;
    numOfEvolutions?: number|null;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface ApiClientOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
}

export interface UnifiedChatProps {
    chatType: ChatType;
    pokemon?: PokemonDetails;
    onClose: () => void;
    onBack?: () => void;
    // For assistant chat
    messages?: ChatMessage[];
    setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    // For pokemon chat
    initialMessage?: string;
    showBackButton?: boolean;
    showAnimation?: boolean;
}

