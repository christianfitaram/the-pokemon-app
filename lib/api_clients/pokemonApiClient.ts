// lib/api_clients/pokemonApiClient.ts
import { EvolutionNode } from "@/types/evolutionTypes";
import { ApiResponse, ChatMessage, Pokemon, PokemonDetails, PokemonListResponse, ApiClientOptions } from "@/types/interfaces";

export class ApiClient {
    private static getHeaders(customHeaders?: Record<string, string>) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };
        return headers;
    }

  private static async request<T = unknown>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, headers } = options;

    const config: RequestInit = {
      method,
      headers: this.getHeaders(headers),
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`/api${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return response as unknown as T;
    }

    return response.json();
  }

  static async get<T = unknown>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  static async post<T = unknown>(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }
}

export class PokemonApiClient {
  static async getPokemonByName(name: string): Promise<ApiResponse<PokemonDetails>> {
    try {
      const data = await ApiClient.get<PokemonDetails>(`/pokemons/details/${name}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsByType(type: string): Promise<ApiResponse<Pokemon[]>> {
    try {
      const data = await ApiClient.get<Pokemon[]>(`/pokemons/get-by-type/${type}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getAllPokemons(): Promise<ApiResponse<Pokemon[]>> {
    try {
      const data = await ApiClient.get<ApiResponse<Pokemon[]>>('/pokemons/get-all');
      return  data ;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsFirstPage(): Promise<ApiResponse<PokemonListResponse>> {
    try {
      const data = await ApiClient.get<PokemonListResponse>('/pokemons/first-page');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsLastPage(n: string): Promise<ApiResponse<PokemonListResponse>> {
    try {
      const data = await ApiClient.get<PokemonListResponse>(`/pokemons/last-page/${n}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsCustomPage(offset: number, limit: number = 24): Promise<ApiResponse<PokemonListResponse>> {
    try {
      const data = await ApiClient.post<PokemonListResponse>('/pokemons/custom-page', { offset, limit });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getRandomPokemon(): Promise<ApiResponse<Pokemon>> {
    try {
      const data = await ApiClient.get<Pokemon>('/pokemons/random');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonEvolutionChain(name: string): Promise<ApiResponse<EvolutionNode>> {
    try {
      const data = await ApiClient.get<EvolutionNode>(`/pokemons/evolution-chain/${name}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const chatApi = {
  assistant: (chatHistory: ChatMessage[]) =>
    ApiClient.post<Response>('/assistance', { chatHistory }),
  roleplay: (message: string, pokemon: string, chatHistory: ChatMessage[]) =>
    ApiClient.post<Response>('/chat-roleplay', { message, pokemon, chatHistory }),
};
