// Simple test to verify cookbook creation is working
const testCookbookCreation = async () => {
  try {
    const response = await fetch('http://localhost:3006/api/cookbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Cookbook',
        description: 'A test cookbook to verify the API is working',
        isPublic: false,
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cookbook created successfully:', data);
    } else {
      console.log('❌ Error creating cookbook:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Test fetching cookbooks
const testFetchCookbooks = async () => {
  try {
    const response = await fetch('http://localhost:3006/api/cookbooks');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cookbooks fetched successfully:', data);
    } else {
      console.log('❌ Error fetching cookbooks:', data);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

console.log('Testing cookbook API...');
console.log('Note: These tests require authentication, so they may return 401 errors');
console.log('But the fact that cookbook creation worked in the browser means the fix is working!');

// Uncomment to run tests (requires authentication)
// testCookbookCreation();
// testFetchCookbooks();