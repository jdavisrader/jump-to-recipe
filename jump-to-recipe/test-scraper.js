// Test the recipe scraper functionality directly
const { scrapeRecipeFromUrl } = require('./src/lib/recipe-scraper.ts');

async function testScraper() {
  console.log('Testing Recipe Scraper...\n');

  const testUrls = [
    'https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/',
    'https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524',
  ];

  for (const url of testUrls) {
    console.log(`Testing URL: ${url}`);
    
    try {
      const result = await scrapeRecipeFromUrl(url, 'test-user-id');
      
      if (result) {
        console.log('✅ Success!');
        console.log(`Title: ${result.recipe?.title}`);
        console.log(`Ingredients: ${result.recipe?.ingredients?.length || 0}`);
        console.log(`Instructions: ${result.recipe?.instructions?.length || 0}`);
        console.log(`Method: ${result.method}`);
        console.log(`Confidence: ${result.confidence}`);
        if (result.warnings) {
          console.log(`Warnings: ${result.warnings.join(', ')}`);
        }
      } else {
        console.log('❌ No recipe data found');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
    
    console.log('---\n');
  }
}

testScraper();