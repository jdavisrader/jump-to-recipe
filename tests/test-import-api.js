// Test script to debug the recipe import API
const fetch = require('node-fetch');

async function testImport() {
  const url = 'https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/';
  
  try {
    console.log('🔍 Testing import for:', url);
    
    const response = await fetch('http://localhost:3000/api/recipes/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });
    
    const result = await response.json();
    
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