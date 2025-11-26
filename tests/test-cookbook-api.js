// Simple test script for cookbook API endpoints
// Run with: node test-cookbook-api.js

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';
let authCookie = '';

// Replace with your test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

// Test cookbook data
const testCookbook = {
  title: 'My Test Cookbook',
  description: 'A cookbook for testing the API',
  isPublic: true
};

let createdCookbookId = '';

// Login to get auth cookie
async function login() {
  console.log('Logging in...');
  try {
    const response = await fetch(`${BASE_URL}/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        redirect: false
      }),
      redirect: 'manual'
    });
    
    // Get cookies from response
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      authCookie = cookies;
      console.log('Login successful');
    } else {
      console.error('No auth cookie received');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}

// Test GET /api/cookbooks
async function testGetCookbooks() {
  console.log('\nTesting GET /api/cookbooks');
  try {
    const response = await fetch(`${BASE_URL}/cookbooks`, {
      headers: {
        Cookie: authCookie
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test POST /api/cookbooks
async function testCreateCookbook() {
  console.log('\nTesting POST /api/cookbooks');
  try {
    const response = await fetch(`${BASE_URL}/cookbooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie
      },
      body: JSON.stringify(testCookbook)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.cookbook && data.cookbook.id) {
      createdCookbookId = data.cookbook.id;
      console.log('Created cookbook ID:', createdCookbookId);
    }
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test GET /api/cookbooks/[id]
async function testGetCookbook(id) {
  console.log(`\nTesting GET /api/cookbooks/${id}`);
  try {
    const response = await fetch(`${BASE_URL}/cookbooks/${id}`, {
      headers: {
        Cookie: authCookie
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test PUT /api/cookbooks/[id]
async function testUpdateCookbook(id) {
  console.log(`\nTesting PUT /api/cookbooks/${id}`);
  try {
    const response = await fetch(`${BASE_URL}/cookbooks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie
      },
      body: JSON.stringify({
        title: 'Updated Cookbook Title',
        description: 'This cookbook has been updated',
        isPublic: false
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test DELETE /api/cookbooks/[id]
async function testDeleteCookbook(id) {
  console.log(`\nTesting DELETE /api/cookbooks/${id}`);
  try {
    const response = await fetch(`${BASE_URL}/cookbooks/${id}`, {
      method: 'DELETE',
      headers: {
        Cookie: authCookie
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run all tests
async function runTests() {
  await login();
  
  // Get all cookbooks
  await testGetCookbooks();
  
  // Create a cookbook
  await testCreateCookbook();
  
  if (createdCookbookId) {
    // Get the created cookbook
    await testGetCookbook(createdCookbookId);
    
    // Update the cookbook
    await testUpdateCookbook(createdCookbookId);
    
    // Get the updated cookbook
    await testGetCookbook(createdCookbookId);
    
    // Delete the cookbook
    await testDeleteCookbook(createdCookbookId);
  }
  
  // Verify deletion by getting all cookbooks again
  await testGetCookbooks();
}

// Run the tests
runTests().catch(console.error);