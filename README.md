# The Pokemon App

Production-minded Next.js + TypeScript application for Pokemon discovery, AI-assisted interaction, and secure API delivery.

## What This App Demonstrates

This project is a portfolio-ready full-stack build focused on backend reliability, API hardening, and user-facing chat/search experiences rather than a static UI-only showcase.

- Defensive API engineering: origin controls, rate limits, health checks, and regression coverage.
- Data and performance discipline: Redis + bounded in-memory cache fallback across critical routes.
- AI integration maturity: provider-abstracted chat/retrieval routes with typed validation and observability hooks.

## Proof Of Engineering Quality

Latest verified run (April 14, 2026):

- `npm run lint` -> pass
- `npm run typecheck` -> pass
- `npm test -- --runInBand` -> pass (23/23 suites, 78/78 tests)
- `npm run test:e2e` -> pass (2/2 Cypress scenarios)
- `npm audit --json` -> pass (0 vulnerabilities)

## Architecture At A Glance

- Architecture narrative + diagrams: [`docs/architecture.md`](docs/architecture.md)
- Observability notes: [`docs/observability.md`](docs/observability.md)
- Database initialization details: [`docs/DATABASE_INITIALIZATION.md`](docs/DATABASE_INITIALIZATION.md)

## Main Features

- Paginated Pokemon catalog with list/grid toggle and persisted UI preferences
- Pokedex route for browsing and filtering Pokemon
- Pokemon details page with stats, themed UI, and evolution chain
- Type filtering and multi-type intersection
- Random Pokemon route
- Team builder route for assembling and reviewing squads
- AI assistant route and Pokemon roleplay route (streaming responses)
- API security middleware (origin checks, rate limiting, security headers)
- Multi-layer caching (Redis + bounded in-memory fallback)

## Tech Stack

- Next.js 15
- React 18 + TypeScript
- Tailwind CSS
- Redis cache layer
- PostgreSQL + pgvector (AI retrieval context)
- OpenAI API or Gemini API (OpenAI-compatible)
- Jest (unit/regression) + Cypress (E2E)

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
- `npm run check:portfolio` - validate portfolio docs/media + internal Markdown links

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

- Jest suite covers high-risk regressions, including:
  - AI origin guards
  - middleware origin enforcement
  - Pokemon API response contract
  - random endpoint single-attempt behavior
  - bounded in-memory cache behavior
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
│   │   ├── health/
│   │   ├── internal/
│   │   └── pokemons/
│   ├── pokedex/
│   ├── pokemon/
│   ├── pokemon-type/
│   ├── random-pokemon/
│   └── team-builder/
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
├── docs/
├── scripts/
├── utils/
├── public/
├── test/
└── types/
```

## Production

```bash
npm run build
npm run start
```
