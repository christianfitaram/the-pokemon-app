import {ChatType} from "@/types/chatTypes";

export interface Pokemon {
    name: string;
    url?: string;
    viewedAt?: number;
    id?: number;
    types?: PokemonType[];
    base_experience?: number;
}

export interface PokemonListResponse {
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
    id: number;
    height: number;
    weight: number;
    base_experience: number;
    types: PokemonType[];
    sprites: PokemonSprites;
    url?: string;
}
export interface PokemonsToDisplayProps {
    pokemons: Pokemon[];
    count: number;
    loading: boolean;
    isSearchOn: boolean;
    currentPage: number;
    onPageChange: (page: number) => void;
    pending: boolean;

}

export interface SearchProps extends ToDisplayProps {
    setIsSearchOn: (val: boolean) => void;
    setIsUserChatting: (val: boolean) => void;
    setTypeLoading: (val: boolean) => void;
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
    isActive?: boolean;
    isList?: boolean;
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
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
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

export interface UsePaginationReturn {
    totalPages: number;
    isLoading: boolean;
    error: Error | null;
}

export interface ActionButtonsProps {
    goToHome: () => void;
    toListRecentlyViewed: () => void;
    showAssistantChat: () => void;
}

export interface SearchInputProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    highlightedIndex: number;
    setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
    noMatchesMessage: string | null;
    setNoMatchesMessage: (message: string | null) => void;
    filteredDropdown: Pokemon[];
    onClear: () => void;
    handleDropdownSelect: (pokemon: Pokemon) => void;
}

export interface SelectedTypesProps {
    selectedTypes: string[];
    removeType: (type: string) => void;
    onClearAll?: () => void;
}

export interface TypeApiResponse {
    pokemon: Array<{
        pokemon: Pokemon;
        slot: number;
    }>;
}

export interface DisplayPreferences {
    isListView: boolean;
}

export interface UsePokemonListProps {
    initialValue: Pokemon[];
    onChange: (pokemons: Pokemon[]) => void;
}
