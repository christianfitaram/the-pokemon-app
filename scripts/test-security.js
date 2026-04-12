#!/usr/bin/env node

/**
 * Security Test Script
 * 
 * This script tests the security measures implemented in your Pokemon app.
 * Run this to verify that your API endpoints are properly protected.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TRUSTED_ORIGIN = process.env.TRUSTED_ORIGIN || 'http://localhost:3000';
const UNTRUSTED_ORIGIN = process.env.UNTRUSTED_ORIGIN || 'https://evil.example';

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
  console.log('Testing API Security Measures\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const tests = [
    {
      name: 'Direct API access without origin header (server-side call should pass)',
      url: `${BASE_URL}/api/pokemons/get-all`,
      expectedStatus: 200
    },
    {
      name: 'API access with untrusted origin (should fail)',
      url: `${BASE_URL}/api/pokemons/get-all`,
      options: {
        headers: {
          'Content-Type': 'application/json',
          Origin: UNTRUSTED_ORIGIN
        }
      },
      expectedStatus: 403
    },
    {
      name: 'API access with trusted origin (should pass)',
      url: `${BASE_URL}/api/pokemons/get-all`,
      options: {
        headers: {
          'Content-Type': 'application/json',
          Origin: TRUSTED_ORIGIN
        }
      },
      expectedStatus: 200
    },
    {
      name: 'Custom page with invalid payload (should fail)',
      url: `${BASE_URL}/api/pokemons/custom-page`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ offset: -5, limit: 24 })
      },
      expectedStatus: 400
    },
    {
      name: 'Custom page with valid payload (should pass)',
      url: `${BASE_URL}/api/pokemons/custom-page`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ offset: 0, limit: 24 })
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
  console.log('- Ensure ALLOWED_ORIGINS contains only trusted frontend domains');
}

// Run the tests
runSecurityTests().catch(console.error); 
