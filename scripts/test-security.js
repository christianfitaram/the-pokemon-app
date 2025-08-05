#!/usr/bin/env node

/**
 * Security Test Script
 * 
 * This script tests the security measures implemented in your Pokemon app.
 * Run this to verify that your API endpoints are properly protected.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.text();
    return {
      status: response.status,
      ok: response.ok,
      data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
    };
  } catch (error) {
    return {
      status: 'ERROR',
      ok: false,
      data: error.message
    };
  }
}

async function runSecurityTests() {
  console.log('🔒 Testing API Security Measures\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const tests = [
    {
      name: 'Direct API access (should fail)',
      url: `${BASE_URL}/api/pokemons/get-all`,
      expectedStatus: 403
    },
    {
      name: 'API access without secret header (should fail)',
      url: `${BASE_URL}/api/pokemons/get-all`,
      options: {
        headers: { 'Content-Type': 'application/json' }
      },
      expectedStatus: 403
    },
    {
      name: 'API access with wrong secret (should fail)',
      url: `${BASE_URL}/api/pokemons/get-all`,
      options: {
        headers: {
          'Content-Type': 'application/json',
          'x-frontend-secret': 'wrong-secret'
        }
      },
      expectedStatus: 403
    },
    {
      name: 'API access with correct secret (should succeed)',
      url: `${BASE_URL}/api/pokemons/get-all`,
      options: {
        headers: {
          'Content-Type': 'application/json',
          'x-frontend-secret': process.env.FRONTEND_SECRET || 'your-secret-key-change-this'
        }
      },
      expectedStatus: 200
    }
  ];

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    const result = await testRequest(test.url, test.options);
    
    const passed = result.status === test.expectedStatus;
    const statusIcon = passed ? '✅' : '❌';
    
    console.log(`${statusIcon} Status: ${result.status} (expected: ${test.expectedStatus})`);
    console.log(`   Response: ${result.data}\n`);
  }

  console.log('🎯 Security Test Summary:');
  console.log('- If all tests show ✅, your security is working correctly');
  console.log('- If any test shows ❌, check your environment variables and middleware configuration');
  console.log('- Make sure to set FRONTEND_SECRET in your .env.local file for production');
}

// Run the tests
runSecurityTests().catch(console.error); 