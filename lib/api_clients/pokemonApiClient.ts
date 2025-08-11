// lib/api_clients/pokemonApiClient.ts
import { EvolutionNode } from "@/types/evolutionTypes";
import { ApiResponse, Pokemon, PokemonDetails, PokemonListResponse, ApiClientOptions } from "@/types/interfaces";

const FRONTEND_SECRET = process.env.NEXT_PUBLIC_FRONTEND_SECRET || 'your-secret-key-change-this';

export class ApiClient {
  private static getHeaders(customHeaders?: Record<string, string>) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (FRONTEND_SECRET && FRONTEND_SECRET !== 'your-secret-key-change-this') {
      headers['x-frontend-secret'] = FRONTEND_SECRET;
    }

    return headers;
  }

  private static async request<T = any>(
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
      return response as any;
    }

    return response.json();
  }

  static async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  static async post<T = any>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }
}

export class PokemonApiClient {
  static async getPokemonByName(name: string): Promise<ApiResponse<PokemonDetails>> {
    try {
      const data = await ApiClient.get(`/pokemons/details/${name}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsByType(type: string): Promise<ApiResponse<Pokemon[]>> {
    try {
      const data = await ApiClient.get(`/pokemons/get-by-type/${type}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getAllPokemons(): Promise<ApiResponse<Pokemon[]>> {
    try {
      const data = await ApiClient.get('/pokemons/get-all');
      return  data ;
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsFirstPage(): Promise<ApiResponse<PokemonListResponse>> {
    try {
      const data = await ApiClient.get('/pokemons/first-page');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsLastPage(n: string): Promise<ApiResponse<PokemonListResponse>> {
    try {
      const data = await ApiClient.get(`/pokemons/last-page/${n}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonsCustomPage(urlParameter: string): Promise<ApiResponse<PokemonListResponse>> {
    try {
      const data = await ApiClient.post('/pokemons/custom-page', { url: urlParameter });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getRandomPokemon(): Promise<ApiResponse<Pokemon>> {
    try {
      const data = await ApiClient.get('/pokemons/random');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async getPokemonEvolutionChain(name: string): Promise<ApiResponse<EvolutionNode>> {
    try {
      const data = await ApiClient.get(`/pokemons/evolution-chain/${name}`);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const chatApi = {
  assistant: (chatHistory: any[]) => 
    ApiClient.post('/assistance', { chatHistory }),
  roleplay: (message: string, pokemon: string, chatHistory: any[]) =>
    ApiClient.post('/chat-roleplay', { message, pokemon, chatHistory }),
};
