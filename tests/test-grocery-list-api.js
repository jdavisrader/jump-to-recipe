const API_BASE = 'http://localhost:3000/api';

// Test data - sample recipe IDs (these would need to exist in your database)
const testRecipeIds = ['test-recipe-1', 'test-recipe-2'];

async function testGroceryListGeneration() {
  console.log('Testing grocery list generation...');
  
  try {
    const response = await fetch(`${API_BASE}/grocery-list/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need proper authentication headers
      },
      body: JSON.stringify({
        recipeIds: testRecipeIds,
        title: 'Test Grocery List',
        servingAdjustments: {
          'test-recipe-1': 4,
          'test-recipe-2': 2
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Grocery list generated successfully:', data);
      return data.id;
    } else {
      const error = await response.json();
      console.log('❌ Failed to generate grocery list:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing grocery list generation:', error);
    return null;
  }
}

async function testGroceryListRetrieval(listId) {
  console.log('Testing grocery list retrieval...');
  
  try {
    const response = await fetch(`${API_BASE}/grocery-list/${listId}`, {
      headers: {
        // Note: In a real test, you'd need proper authentication headers
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Grocery list retrieved successfully:', data);
      return true;
    } else {
      const error = await response.json();
      console.log('❌ Failed to retrieve grocery list:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing grocery list retrieval:', error);
    return false;
  }
}

async function testGroceryListUpdate(listId) {
  console.log('Testing grocery list update...');
  
  try {
    const response = await fetch(`${API_BASE}/grocery-list/${listId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need proper authentication headers
      },
      body: JSON.stringify({
        title: 'Updated Test Grocery List',
        items: [
          {
            id: 'item-1',
            name: 'Milk',
            amount: 1,
            unit: 'gallon',
            category: 'dairy',
            isCompleted: false,
            recipeIds: ['test-recipe-1']
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Grocery list updated successfully:', data);
      return true;
    } else {
      const error = await response.json();
      console.log('❌ Failed to update grocery list:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing grocery list update:', error);
    return false;
  }
}

async function testGroceryListListing() {
  console.log('Testing grocery list listing...');
  
  try {
    const response = await fetch(`${API_BASE}/grocery-list?page=1&limit=10`, {
      headers: {
        // Note: In a real test, you'd need proper authentication headers
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Grocery lists retrieved successfully:', data);
      return true;
    } else {
      const error = await response.json();
      console.log('❌ Failed to retrieve grocery lists:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing grocery list listing:', error);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Grocery List API Tests');
  console.log('Note: These tests require authentication and existing recipes in the database');
  
  // Test generation
  const listId = await testGroceryListGeneration();
  
  if (listId) {
    // Test retrieval
    await testGroceryListRetrieval(listId);
    
    // Test update
    await testGroceryListUpdate(listId);
  }
  
  // Test listing
  await testGroceryListListing();
  
  console.log('🏁 Tests completed');
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testGroceryListGeneration,
    testGroceryListRetrieval,
    testGroceryListUpdate,
    testGroceryListListing,
    runTests
  };
} else {
  // Run tests if called directly
  runTests();
}