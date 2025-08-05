
# The Pokemon App

A modern Pokemon application built with Next.js, featuring chat functionality with Pokemon and an AI assistant.

## Features

- 🎮 **Pokemon Database**: Browse and search through Pokemon data
- 💬 **AI Chat Assistant**: Get help and information about Pokemon
- 🎭 **Pokemon Roleplay Chat**: Chat with individual Pokemon characters
- 🔍 **Advanced Search**: Search by name, type, and other criteria
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure API**: Protected endpoints with origin validation and rate limiting

## Security Features

This application includes comprehensive security measures to protect API endpoints:

- **Origin-based Restrictions**: Only requests from allowed domains are accepted
- **Custom Header Authentication**: All requests must include a secret header
- **Rate Limiting**: Prevents abuse with configurable request limits
- **Security Headers**: Additional protection against common attacks

See [SECURITY_SETUP.md](./SECURITY_SETUP.md) for detailed configuration instructions.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- PostgreSQL database (optional, for enhanced features)

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

# Database Configuration (optional)
DATABASE_URL=your-database-url
```

## API Endpoints

All API endpoints are protected by security middleware:

- `/api/pokemons/*` - Pokemon data endpoints
- `/api/assistance` - AI assistant chat
- `/api/chat-roleplay` - Pokemon roleplay chat

## Technologies Used

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI**: OpenAI GPT-4
- **Database**: PostgreSQL with pgvector (optional)
- **Security**: Custom middleware with origin validation and rate limiting

## Project Structure

```
the-pokemon-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (protected)
│   ├── components/        # React components
│   └── ...
├── lib/                   # Utility libraries
├── utils/                 # Helper functions
├── types/                 # TypeScript type definitions
├── middleware.ts          # Security middleware
└── SECURITY_SETUP.md      # Security configuration guide
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the security measures
5. Submit a pull request

## License

This project is licensed under the MIT License.
