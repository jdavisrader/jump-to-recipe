// Test the import API endpoint
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
    
    if (response.ok) {
      console.log('✅ Import successful!');
      console.log('Method used:', result.method);
      console.log('Confidence:', result.confidence);
      console.log('Recipe title:', result.recipe?.title);
      console.log('Ingredients count:', result.recipe?.ingredients?.length || 0);
      console.log('Instructions count:', result.recipe?.instructions?.length || 0);
      console.log('Image URL:', result.recipe?.imageUrl);
      console.log('Prep time:', result.recipe?.prepTime);
      console.log('Cook time:', result.recipe?.cookTime);
      console.log('Servings:', result.recipe?.servings);
      
      if (result.warnings) {
        console.log('⚠️ Warnings:', result.warnings);
      }
    } else {
      console.error('❌ Import failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testImport();