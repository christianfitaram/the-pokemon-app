
# 🧬 Pokémon App Documentation

## 📦 Overview

This app is a modern Pokémon browser built with **React + Next.js**, featuring rich animations, type-based search, evolutionary data, and AI-powered chat—both with an assistant and with Pokémon themselves.

---

## 📁 Components

### 🧠 `AssistantChat.tsx`
A general-purpose assistant chat using OpenAI (or similar API).  
**Features:**
- Scrollable chat with user and assistant messages.
- Typing indicator.
- Submit via Enter or Send button.
- Assistant fetches response from `/api/assistance`.

### 💬 `PokemonChat.tsx`
Interactive chat interface between the user and a specific Pokémon.  
**Features:**
- Pokémon greets the user.
- Type-aware styling.
- Real-time responses from `/api/chat`.
- Avatar shown using the Pokémon's official artwork.
- Typing indicator while the AI is responding.

### 🧪 `PokemonCard.tsx`
Displays a visual card for a Pokémon with dynamic styling based on type.  
**Features:**
- Hover animation.
- Type badge(s).
- Viewed timestamp (if available).
- Background gradient based on type.

### 🔍 `Search.tsx`
Main entry point for searching Pokémon by:
- Name (with real-time dropdown).
- Type (multi-select).
- Random Pokémon generator.
- Recently viewed Pokémon.
- Link to open the Assistant chat.

### 🧬 `EvolutionCard.tsx`
Displays the entire evolution chain of a Pokémon.  
**Uses:**
- `/pokemon-species/:name` and its `evolution_chain.url`.
- Recursively collects and maps over all evolution stages.
- Renders each stage with a `PokemonCard`.

### 🧾 `PokemonDetailsPage.tsx`
Detailed view of an individual Pokémon.  
**Features:**
- Image, name, height, weight, types.
- Type icon styling.
- Animated appearance with Framer Motion.
- Button to start a chat with the Pokémon.
- Button to go back to the home screen.
- Embedded `EvolutionCard`.

### 🎴 `Pokemons.tsx`
Initial list rendering logic + pagination for the main Pokémon list.  
**Features:**
- Fetches from the PokéAPI.
- Fallback to `value` for displaying filtered/search results.
- Delegates rendering to `PokemonsToDisplay`.

### 🧾 `PokemonsToDisplay.tsx`
Paginated grid view of Pokémon cards.  
**Features:**
- Handles pagination (start, prev, next, end).
- Uses `PokemonCard`.
- Displays loading skeletons while fetching data.

### ⌨️ `TypingIndicator.tsx`
A 3-dot animated typing indicator used in both chat components.

---

## 🧠 State Management

- **Local state** is used for most interactions (`useState`, `useEffect`, `useRef`).
- **Props drilling** is used between parent/child components (e.g., `value`, `onChange`, `isSearchOn`, etc.)
- Recently viewed Pokémon are handled via a custom hook `useRecentlyViewed()`.

---

## 🔧 Utility Files

### `functions.tsx`
Helper functions:
```ts
capitalizeFirstLetter(text: string): string
getRandomNumber(): number // random from 1 to 1302
```

### `typeColors.ts`
Defines type-specific colors and gradients (e.g. for UI themes, backgrounds, badges).

### `useRecentlyViewed.tsx`
Custom React hook for localStorage-backed recent Pokémon tracking:
```ts
useRecentlyViewed(limit = 10) => {
  recent: Pokemon[],
  savePokemon(name: string, url: string)
}
```

---

## 🔍 Search & Fetch Utilities

### `fetchspecials.tsx`
- `fetchRandomPokemon()` → returns a random Pokémon name.
- `getLastPage(n: number)` → gets the last page for pagination.
- `fetchPokemon(url: string)` → used by `searchEngine` to fetch Pokémon by type.

### `searchEngine.tsx`
Filters Pokémon by selected types:
```ts
searchEngine(["fire", "electric"]) => Promise<Pokemon[]>
```

---

## 🧪 API Routes

### `/api/assistance`
**Used by:** `AssistantChat.tsx`  
**Request:**
```json
{
  "chatHistory": [ { "role": "user", "content": "Hi!" } ]
}
```
**Response:**
```json
{ "reply": "Hello! How can I help you today?" }
```

### `/api/chat`
**Used by:** `PokemonChat.tsx`  
**Request:**
```json
{
  "pokemon": "pikachu",
  "chatHistory": [ { "role": "user", "content": "Hello" } ]
}
```
**Response:**
```json
{ "reply": "Pika pika!" }
```

---

## 🧪 External APIs

- **[PokéAPI](https://pokeapi.co/)**
  - Pokémon list: `https://pokeapi.co/api/v2/pokemon/`
  - Pokémon species: `https://pokeapi.co/api/v2/pokemon-species/:name`
  - Evolution chain URL is retrieved from species data.

---

## 💡 UX/UI Notes

- All cards and chat UIs are styled with Tailwind CSS.
- Animations are handled using **Framer Motion**.
- Gradient backgrounds are type-aware using custom utility: `typeColors`, `typeGradients`.
