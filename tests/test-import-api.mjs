// Test script to debug the recipe import API
import fetch from 'node-fetch';

async function testImport() {
  const url = 'https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/';
  
  try {
    console.log('🔍 Testing import for:', url);
    
    // First, let's try to access the demo page
    const demoResponse = await fetch('http://localhost:3000/demo');
    if (!demoResponse.ok) {
      console.error('❌ Failed to access demo page:', demoResponse.status, demoResponse.statusText);
      return;
    }
    
    console.log('✅ Demo page accessible');
    
    // Now let's try to import the recipe
    const response = await fetch('http://localhost:3000/api/recipes/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });
    
    // Check if we're being redirected to login
    if (response.redirected) {
      console.error('❌ Import failed: Redirected to login page');
      return;
    }
    
    // Try to parse the response as JSON
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError.message);
      console.log('Response status:', response.status, response.statusText);
      console.log('Response text:', await response.text());
      return;
    }
    
    if (!response.ok) {
      console.error('❌ Import failed:', result.error);
      if (result.details) {
        console.error('Error details:', JSON.stringify(result.details, null, 2));
      }
      return;
    }
    
    console.log('✅ Import successful!');
    console.log('Recipe title:', result.title);
    console.log('Ingredients count:', result.ingredients?.length || 0);
    console.log('Instructions count:', result.instructions?.length || 0);
    console.log('Image URL:', result.imageUrl);
    
    // Log all ingredients
    console.log('\nIngredients:');
    result.ingredients.forEach((ing, index) => {
      console.log(`${index + 1}. ${ing.amount} ${ing.unit} ${ing.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testImport();