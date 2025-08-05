// API client utility for making authenticated requests to your backend
const FRONTEND_SECRET = process.env.NEXT_PUBLIC_FRONTEND_SECRET || 'your-secret-key-change-this';

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export class ApiClient {
  private static getHeaders(customHeaders?: Record<string, string>) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Only add secret header if secret is properly configured
    if (FRONTEND_SECRET && FRONTEND_SECRET !== 'your-secret-key-change-this') {
      headers['x-frontend-secret'] = FRONTEND_SECRET;
    }

    return headers;
  }

  static async request<T = any>(
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

    // Handle streaming responses
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return response as any;
    }

    return response.json();
  }

  // Convenience methods
  static async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  static async post<T = any>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  static async put<T = any>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  static async delete<T = any>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

// Specific API methods for your Pokemon app
export const pokemonApi = {
  getAll: () => ApiClient.get('/pokemons/get-all'),
  getByType: (type: string) => ApiClient.get(`/pokemons/get-by-type/${type}`),
  getDetails: (name: string) => ApiClient.get(`/pokemons/details/${name}`),
  getEvolutionChain: (name: string) => ApiClient.get(`/pokemons/evolution-chain/${name}`),
  getRandom: () => ApiClient.get('/pokemons/random'),
  getFirstPage: () => ApiClient.get('/pokemons/first-page'),
  getLastPage: (n: number) => ApiClient.get(`/pokemons/last-page/${n}`),
  getCustomPage: (page: number) => ApiClient.post('/pokemons/custom-page', { page }),
};

export const chatApi = {
  assistant: (chatHistory: any[]) => ApiClient.post('/assistance', { chatHistory }),
  roleplay: (message: string, pokemon: string, chatHistory: any[]) =>
    ApiClient.post('/chat-roleplay', { message, pokemon, chatHistory }),
}; 