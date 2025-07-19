// Simple test script for the recipe import API
const testUrls = [
  'https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/',
  'https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524',
  'https://www.tasteofhome.com/recipes/makeover-creamy-macaroni-and-cheese/',
];

async function testImportAPI() {
  console.log('Testing Recipe Import API...\n');

  for (const url of testUrls) {
    console.log(`Testing URL: ${url}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/recipes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          preview: true
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Success!');
        console.log(`Title: ${data.recipe?.title}`);
        console.log(`Ingredients: ${data.recipe?.ingredients?.length || 0}`);
        console.log(`Instructions: ${data.recipe?.instructions?.length || 0}`);
        console.log(`Method: ${data.metadata?.scrapingMethod}`);
        if (data.metadata?.warnings) {
          console.log(`Warnings: ${data.metadata.warnings.join(', ')}`);
        }
      } else {
        console.log('❌ Failed:', data.error);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('---\n');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testImportAPI();
}

module.exports = { testImportAPI };