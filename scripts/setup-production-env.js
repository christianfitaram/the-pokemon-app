#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up production environment variables...\n');

// Generate a secure random secret
const generateSecret = () => crypto.randomBytes(64).toString('hex');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  .env.local already exists. Backing up to .env.local.backup');
  fs.copyFileSync(envPath, envPath + '.backup');
}

// Generate new secrets
const frontendSecret = generateSecret();

// Create environment file content
const envContent = `# Production Environment Variables
# Generated on ${new Date().toISOString()}

# Security
FRONTEND_SECRET=${frontendSecret}
NEXT_PUBLIC_FRONTEND_SECRET=${frontendSecret}

# Database (if needed)
# DATABASE_URL=your-database-url

# Other environment variables
NODE_ENV=production
`;

// Write to .env.local
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment variables generated successfully!');
console.log('\n📋 Generated variables:');
console.log(`FRONTEND_SECRET=${frontendSecret}`);
console.log(`NEXT_PUBLIC_FRONTEND_SECRET=${frontendSecret}`);
console.log('\n🔒 Security notes:');
console.log('- Keep these secrets secure and never commit them to version control');
console.log('- Rotate these secrets regularly in production');
console.log('- Make sure both client and server use the same secret');

console.log('\n🚀 Next steps:');
console.log('1. Copy these environment variables to your production server');
console.log('2. Restart your application');
console.log('3. Test the API endpoints');

if (envExists) {
  console.log('\n📁 Backup created at .env.local.backup');
} 