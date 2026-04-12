#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up production environment variables...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
  fs.copyFileSync(envPath, envPath + '.backup');
}

const productionOrigin = process.env.PRODUCTION_ORIGIN || 'https://project1.enricfitaram.dev';
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  productionOrigin,
];

// Create environment file content
const envContent = `# Production Environment Variables
# Generated on ${new Date().toISOString()}

# API Security
ALLOWED_ORIGINS=${allowedOrigins.join(',')}

# OpenAI
OPENAI_API_KEY=replace-with-real-openai-key

# Redis
# REDIS_URL=redis://localhost:6379

# Database (pgvector)
# DB_HOST=localhost
# DB_USER=pokemon_user
# DB_PASSWORD=replace-with-real-db-password
# DB_NAME=pokedb
# DB_PORT=5432

# Runtime
NODE_ENV=production
`;

// Write to .env.local
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment variables generated successfully!');
console.log('\nGenerated variables:');
console.log(`ALLOWED_ORIGINS=${allowedOrigins.join(',')}`);
console.log('\n Security notes:');
console.log('- Keep API keys and DB credentials secure and never commit them');
console.log('- Restrict ALLOWED_ORIGINS to trusted frontend domains only');
console.log('- Rotate credentials regularly in production');

console.log('\n Next steps:');
console.log('1. Copy these environment variables to your production server');
console.log('2. Fill OPENAI_API_KEY and DB credentials');
console.log('3. Restart your application');
console.log('4. Test the API endpoints');

if (envExists) {
  console.log('\n📁 Backup created at .env.local.backup');
} 
