#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://project1.enricfitaram.dev';

console.log('Testing production API endpoints...\n');
console.log(`Base URL: ${BASE_URL}`);
console.log('Using middleware origin checks and validated pagination payloads.\n');

// Test endpoints
const endpoints = [
  '/api/pokemons/first-page',
  '/api/pokemons/get-all',
  '/api/pokemons/random',
];

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Pokemon-App-Test/1.0'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({
            endpoint,
            status: res.statusCode,
            headers: res.headers,
            data: data,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ endpoint, error: error.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({ endpoint, error: 'Request timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const result = await testEndpoint(endpoint);
      
      if (result.success) {
        console.log(`✅ ${endpoint} - Status: ${result.status}`);
        if (result.data && result.data.results) {
          console.log(`   📊 Found ${result.data.results.length} Pokemon`);
        }
      } else {
        console.log(`❌ ${endpoint} - Status: ${result.status}`);
        if (result.data && result.data.error) {
          console.log(`    Error: ${result.data.error}`);
          if (result.data.received) {
            console.log(`    Received origin: ${result.data.received}`);
          }
          if (result.data.allowed) {
            console.log(`    Allowed origins: ${result.data.allowed.join(', ')}`);
          }
        }
      }
    } catch (error) {
      console.log(` ${endpoint} - Error: ${error.error || error.message}`);
    }
    console.log('');
  }
  
  console.log(' Tests completed!');
  console.log('\n Troubleshooting tips:');
  console.log('1. Verify the domain is in ALLOWED_ORIGINS');
  console.log('2. Ensure /api/pokemons/custom-page only receives offset/limit');
  console.log('3. Check server logs for middleware debugging info');
  console.log('4. Ensure environment variables are loaded correctly');
}

// Run tests
runTests().catch(console.error); 
