
# The Pokemon App

A modern Pokemon application built with Next.js, featuring comprehensive chat functionality, detailed Pokemon information, and advanced search capabilities.

## Features

- 🎮 **Pokemon Database**: Browse and search through complete Pokemon data
- 💬 **AI Chat Assistant**: Get help and information about Pokemon with RAG-powered responses
- 🎭 **Pokemon Roleplay Chat**: Chat with individual Pokemon characters in character
- 🔍 **Advanced Search**: Search by name, type, and other criteria with autocomplete
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔒 **Secure API**: Protected endpoints with origin validation and rate limiting
- 🧬 **Evolution Chains**: View detailed evolution information for each Pokemon
- 📊 **Recently Viewed**: Track and access your recently viewed Pokemon
- 🎨 **Dynamic UI**: Color-coded interfaces based on Pokemon types
- 🎲 **Random Pokemon**: Discover new Pokemon with the random feature
- 📄 **Pagination**: Navigate through Pokemon with custom pagination
- 🔄 **Real-time Chat**: Stream responses for smooth chat experience

## Security Features

This application includes comprehensive security measures to protect API endpoints:

- **Origin-based Restrictions**: Only requests from allowed domains are accepted
- **Custom Header Authentication**: All requests must include a secret header
- **Rate Limiting**: Prevents abuse with configurable request limits (100 requests per 15 minutes)
- **Security Headers**: Additional protection against common attacks
- **Environment-based Security**: Automatic security enforcement in production

See [SECURITY_SETUP.md](./SECURITY_SETUP.md) for detailed configuration instructions.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- PostgreSQL database with pgvector extension (for enhanced AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd the-pokemon-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing Security

To verify that your API endpoints are properly secured:

```bash
npm run test:security
```

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Security Configuration
FRONTEND_SECRET=your-super-secret-key-change-this-in-production
NEXT_PUBLIC_FRONTEND_SECRET=your-super-secret-key-change-this-in-production

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Database Configuration (for enhanced AI features)
DATABASE_URL=your-postgresql-database-url-with-pgvector

# Production Configuration
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## API Endpoints

All API endpoints are protected by security middleware:

### Pokemon Data Endpoints
- `/api/pokemons/get-all` - Get all Pokemon
- `/api/pokemons/get-by-type/[type]` - Get Pokemon by type
- `/api/pokemons/details/[name]` - Get detailed Pokemon information
- `/api/pokemons/evolution-chain/[name]` - Get evolution chain data
- `/api/pokemons/first-page` - Get first page of Pokemon
- `/api/pokemons/last-page/[n]` - Get last page with custom count
- `/api/pokemons/custom-page` - Get custom page of Pokemon
- `/api/pokemons/random` - Get random Pokemon

### Chat Endpoints
- `/api/assistance` - AI assistant chat with RAG capabilities
- `/api/chat-roleplay` - Pokemon roleplay chat
- `/api/chat` - Legacy chat endpoint

## Production Deployment

This app includes comprehensive production deployment features:

- **Production Build Scripts**: Optimized builds for production
- **Security Enforcement**: Automatic security in production environment
- **Domain Configuration**: Configurable allowed origins
- **Environment Management**: Separate development and production configs

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed deployment instructions.

## Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI**: OpenAI GPT-4 with embeddings and RAG
- **Database**: PostgreSQL with pgvector for semantic search
- **Security**: Custom middleware with origin validation and rate limiting
- **Icons**: React Icons
- **Markdown**: Marked for chat message formatting

## Project Structure

```
the-pokemon-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (protected)
│   │   ├── assistance/    # AI assistant chat
│   │   ├── chat/          # Chat endpoints
│   │   ├── chat-roleplay/ # Pokemon roleplay
│   │   └── pokemons/      # Pokemon data endpoints
│   ├── components/        # React components
│   │   ├── chat/          # Chat components
│   │   ├── pokemon-details/ # Pokemon detail components
│   │   └── ...            # Other UI components
│   ├── details/           # Pokemon detail pages
│   └── ...
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── api_clients/       # API client classes
│   ├── db/                # Database utilities
│   └── repositories/      # Data access layer
├── utils/                 # Helper functions
├── types/                 # TypeScript type definitions
├── middleware.ts          # Security middleware
├── PRODUCTION_DEPLOYMENT.md # Deployment guide
└── SECURITY_SETUP.md      # Security configuration guide
```

## Key Features Explained

### Unified Chat System
The app features a unified chat interface that supports both AI assistant and Pokemon roleplay modes, with real-time streaming responses and markdown formatting.

### Evolution Chains
View detailed evolution information for each Pokemon, showing the complete evolutionary path from basic to final forms.

### Recently Viewed
The app automatically tracks your recently viewed Pokemon and provides quick access to them through the search interface.

### Advanced Search
- **Type-based Search**: Filter Pokemon by one or multiple types
- **Name Autocomplete**: Real-time name suggestions as you type
- **Random Discovery**: Find random Pokemon to explore
- **Recently Viewed**: Quick access to your browsing history

### Dynamic UI
The interface adapts to each Pokemon's type, using color-coded themes and gradients for an immersive experience.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the security measures
5. Submit a pull request

## License

This project is licensed under the MIT License.
