# The Pokemon App

Next.js + TypeScript app for browsing Pokemon data, viewing details/evolution chains, type-based discovery, and AI-assisted interactions.

## Tech Stack

- Next.js 15
- React 18 + TypeScript
- Tailwind CSS
- Redis cache layer
- PostgreSQL + pgvector (AI retrieval context)
- OpenAI API or Gemini API (OpenAI-compatible)
- Jest (unit/regression) + Cypress (E2E)

## Main Features

- Paginated Pokemon catalog with list/grid toggle and persisted UI preferences
- Pokemon details page with stats, themed UI, and evolution chain
- Type filtering and multi-type intersection
- Random Pokemon route
- AI assistant route and Pokemon roleplay route (streaming responses)
- API security middleware (origin checks, rate limiting, security headers)
- Multi-layer caching (Redis + bounded in-memory fallback)

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - ESLint checks
- `npm run typecheck` - TypeScript checks
- `npm test` - Jest regression/unit tests
- `npm run test:e2e` - Cypress end-to-end tests
- `npm run warm:cache` - warm Pokemon cache entries
- `npm run warm:types` - warm type endpoint cache entries
- `npm run warm:redis` - run both warm scripts
- `npm run test:security` - security script checks

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment variables (`.env`) for:

- `AI_PROVIDER` (`openai` or `gemini`)
- `OPENAI_API_KEY` (required when `AI_PROVIDER=openai`)
- `GEMINI_API_KEY` (required when `AI_PROVIDER=gemini`)
- Optional model overrides: `AI_CHAT_MODEL`, `AI_EMBEDDING_MODEL`, `AI_EMBEDDING_DIM`
- `REDIS_URL`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Optional: `ALLOWED_ORIGINS`

3. Run locally

```bash
npm run dev
```

## API Contract

Pokemon endpoints follow a unified response shape:

```json
{
  "success": true,
  "data": {}
}
```

Error shape:

```json
{
  "success": false,
  "error": "message"
}
```

## Testing

- Jest suite covers regression risks introduced during hardening:
  - AI origin guards
  - middleware origin enforcement
  - Pokemon API response contract
  - random endpoint single-attempt behavior
  - bounded in-memory cache
  - list/pagination fetch behavior
  - PokemonCard no per-card fetch fallback
- Cypress keeps user-level E2E coverage.

## Project Structure

```text
the-pokemon-app/
├── app/
│   ├── api/
│   │   ├── assistance/
│   │   ├── chat-roleplay/
│   │   └── pokemons/
│   ├── pokemon/
│   └── pokemon-type/
├── components/
├── hooks/
├── lib/
│   ├── api_clients/
│   ├── db/
│   ├── repositories/
│   ├── security/
│   └── validation/
├── __tests__/regression/
├── cypress/e2e/
├── utils/
└── types/
```

## Production

```bash
npm run build
npm run start
```
