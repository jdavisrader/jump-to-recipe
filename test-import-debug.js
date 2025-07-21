// Test the actual import functionality
const fetch = require('node-fetch');

async function testJoyFoodImport() {
  const url = 'https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/';
  
  try {
    console.log('🔍 Fetching URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JumpToRecipe/1.0; +https://jumptorecipe.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('✅ HTML fetched, length:', html.length);
    
    // Look for JSON-LD script tags
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let foundJsonLd = false;
    
    while ((match = scriptRegex.exec(html)) !== null) {
      foundJsonLd = true;
      const jsonContent = match[1].trim();
      
      try {
        const jsonData = JSON.parse(jsonContent);
        console.log('📋 Found JSON-LD script tag');
        
        // Check if it has a Recipe
        if (jsonData['@type'] === 'Recipe') {
          console.log('✅ Direct Recipe found');
          console.log('Recipe name:', jsonData.name);
        } else if (jsonData['@graph']) {
          console.log('🔍 Checking @graph for Recipe...');
          const recipe = jsonData['@graph'].find((item) => 
            typeof item === 'object' && item !== null && 
            '@type' in item && item['@type'] === 'Recipe'
          );
          
          if (recipe) {
            console.log('✅ Recipe found in @graph');
            console.log('Recipe name:', recipe.name);
            console.log('Ingredients count:', recipe.recipeIngredient?.length || 0);
            console.log('Instructions count:', recipe.recipeInstructions?.length || 0);
            console.log('Image type:', typeof recipe.image);
            console.log('Prep time:', recipe.prepTime);
            console.log('Cook time:', recipe.cookTime);
            console.log('Yield:', recipe.recipeYield);
          } else {
            console.log('❌ No Recipe found in @graph');
            console.log('Available types:', jsonData['@graph'].map(item => item['@type']).join(', '));
          }
        } else {
          console.log('❓ JSON-LD found but no Recipe or @graph');
          console.log('Type:', jsonData['@type']);
        }
      } catch (parseError) {
        console.error('❌ Error parsing JSON-LD:', parseError.message);
      }
    }
    
    if (!foundJsonLd) {
      console.log('❌ No JSON-LD script tags found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testJoyFoodImport();