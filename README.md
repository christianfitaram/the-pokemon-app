
# Pokemon List Application

A React application that displays Pokemon using the PokeAPI, featuring list/grid views and state persistence.

## Requirements

- Node.js 18+
- npm 9+

## Technologies Used

- React with Next.js 15.2.4
- TypeScript 5.8.3
- TailwindCSS 3.4.1 for styling
- Cypress 14.5.4 for E2E testing

## Features

### View Toggle
- Switch between list and grid views
- Responsive grid layout:
    - Desktop: 4 columns
    - Tablet: 3 columns
    - Mobile: 2 columns
- View preference persists between sessions

### Pokemon Details
- Accessible via `/pokemon/{id}` route
- Displays Pokemon name and image
- Back navigation preserves list state:
    - Maintains current page
    - Keeps selected view type (list/grid)

### Testing
End-to-end tests implemented with Cypress, covering:
- Search functionality
- Pokemon details navigation
- View toggle behavior

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```
2. Install dependencies:
```bash
npm install
```
3. Start the development server:
```bash
npm run dev
```
4. Run tests:
```bash
cypress run
```

## API

The application uses the [PokeAPI](https://pokeapi.co/) for Pokemon data, this public endpoints are managed internally in the own project API. There are rules of rate limiting and redis cache:
- List endpoint: `https://pokeapi.co/api/v2/pokemon`
- Details endpoint: `https://pokeapi.co/api/v2/pokemon/{id}`
  
- (Among others)

## Main Project Structure

```
the-pokemon-app/
├── app/                                    # Next.js app directory
│   ├── api/                                # API routes (protected)
│   │   ├── assistance/                     # AI assistant chat
│   │   ├── chat/                           # Chat endpoints
│   │   ├── chat-roleplay/                  # Pokemon roleplay
│   │   └── pokemons/                       # Pokemon data endpoints         
│   ├── pokemon/                            # Pokemon detail pages
│   │   ├─[slug]                            # Route to /pokemon/....
│   └── ...                                 # Other pages
├── components/                             # React components
│   │   ├── chat/                           # Chat components
│   │   ├── pokemon-details/                # Pokemon detail components
│   │   └── ...                             # Other UI components
├── cypress/                                # React components
│   │   ├── e2e/                            # e2e test
│   │       ├── pokemon-search.cy.ts/ 
│   │   └── ...
├── hooks/                                  # Custom React hooks
├── lib/                                    # Utility libraries
│   ├── api_clients/                        # API client classes
│   ├── db/                                 # Database utilities
│   ├── repositories/                       # Data access layer
│   └── ...                 
├── utils/                                  # Helper functions
├── types/                                  # TypeScript type definitions
├── middleware.ts                           # Security middleware
```
## Implementation Details

### View Toggle
- Implemented using TailwindCSS Grid
- Responsive classes:
  ```css
  grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
  ```

### State Management
- Local storage for view preference
- URL parameters for current page
- State preservation when navigating

### Testing
Main test scenarios:
- Pokemon search functionality
- Details page navigation


## Running in Production

Build and start the production server:
```bash
npm run build npm start
```

## Screenshots
### Homepage
![Pokemon App Screenshot](https://storage.googleapis.com/multimedia-assets/Screenshot%202025-08-14%20at%2013.15.48.png)  
### Details page
![Pokemon App Screenshot](https://storage.googleapis.com/multimedia-assets/Screenshot%202025-08-14%20at%2013.16.07.png)  
### Tests
![Pokemon App Screenshot](https://storage.googleapis.com/multimedia-assets/Screenshot%202025-08-14%20at%2013.16.55.png)  


