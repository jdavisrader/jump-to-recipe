// Simple test script to verify the comments API endpoints work
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_RECIPE_ID = 'test-recipe-id';

async function testCommentsAPI() {
  console.log('Testing Comments API...');
  
  try {
    // Test GET comments endpoint
    console.log('\n1. Testing GET /api/recipes/[id]/comments');
    const getResponse = await fetch(`${BASE_URL}/api/recipes/${TEST_RECIPE_ID}/comments`);
    console.log('GET Status:', getResponse.status);
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('GET Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await getResponse.json();
      console.log('GET Error:', error);
    }
    
    // Test POST comments endpoint (this will fail without authentication, but we can see the structure)
    console.log('\n2. Testing POST /api/recipes/[id]/comments');
    const postResponse = await fetch(`${BASE_URL}/api/recipes/${TEST_RECIPE_ID}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'This is a test comment',
        isPrivateNote: false,
      }),
    });
    
    console.log('POST Status:', postResponse.status);
    const postData = await postResponse.json();
    console.log('POST Response:', JSON.stringify(postData, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testCommentsAPI();
}

module.exports = { testCommentsAPI };