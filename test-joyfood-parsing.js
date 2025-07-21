// Test script to debug the joyfoodsunshine parsing issue

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/#article",
      // ... other article data
    },
    {
      "@type": "Recipe",
      "name": "The Best Chocolate Chip Cookie Recipe Ever",
      "author": {
        "@id": "https://joyfoodsunshine.com/#/schema/person/26aa1eec196fcfdeab13ab7a9999d220"
      },
      "description": "This is the best chocolate chip cookie recipe ever. No funny ingredients, no chilling time, etc. Just a simple, straightforward, amazingly delicious, doughy yet still fully cooked, chocolate chip cookie that turns out perfectly every single time!",
      "datePublished": "2018-02-11T04:00:40+00:00",
      "image": [
        "https://joyfoodsunshine.com/wp-content/uploads/2016/01/best-chocolate-chip-cookies-recipe-ever-no-chilling-1.jpg",
        "https://joyfoodsunshine.com/wp-content/uploads/2016/01/best-chocolate-chip-cookies-recipe-ever-no-chilling-1-500x500.jpg",
        "https://joyfoodsunshine.com/wp-content/uploads/2016/01/best-chocolate-chip-cookies-recipe-ever-no-chilling-1-500x375.jpg",
        "https://joyfoodsunshine.com/wp-content/uploads/2016/01/best-chocolate-chip-cookies-recipe-ever-no-chilling-1-480x270.jpg"
      ],
      "recipeYield": ["36", "36 cookies"],
      "prepTime": "PT10M",
      "cookTime": "PT8M",
      "totalTime": "PT30M",
      "recipeIngredient": [
        "1 cup salted butter (softened)",
        "1 cup granulated sugar",
        "1 cup light brown sugar (packed)",
        "2 teaspoons pure vanilla extract",
        "2 large eggs",
        "3 cups all-purpose flour",
        "1 teaspoon baking soda",
        "½ teaspoon baking powder",
        "1 teaspoon sea salt",
        "2 cups chocolate chips ((12 oz))"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Preheat oven to 375 degrees F. Line three baking sheets with parchment paper and set aside.",
          "name": "Preheat oven to 375 degrees F. Line three baking sheets with parchment paper and set aside.",
          "url": "https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/#wprm-recipe-8678-step-0-0"
        },
        {
          "@type": "HowToStep",
          "text": "In a medium bowl mix flour, baking soda, baking powder and salt. Set aside.",
          "name": "In a medium bowl mix flour, baking soda, baking powder and salt. Set aside.",
          "url": "https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/#wprm-recipe-8678-step-0-1"
        }
        // ... more instructions
      ]
    }
  ]
};

// Test our extraction logic
function findRecipeInGraph(jsonData) {
  if (jsonData['@type'] === 'Recipe') {
    console.log('✅ Found direct Recipe object');
    return jsonData;
  } else if (jsonData['@graph']) {
    console.log('🔍 Searching in @graph array...');
    const recipe = jsonData['@graph'].find((item) => 
      typeof item === 'object' && item !== null && 
      '@type' in item && item['@type'] === 'Recipe'
    );
    if (recipe) {
      console.log('✅ Found Recipe in @graph');
      return recipe;
    } else {
      console.log('❌ No Recipe found in @graph');
      console.log('Available types:', jsonData['@graph'].map(item => item['@type']));
    }
  }
  return null;
}

const recipe = findRecipeInGraph(jsonLdData);
if (recipe) {
  console.log('\n📋 Recipe found:');
  console.log('Title:', recipe.name);
  console.log('Ingredients count:', recipe.recipeIngredient?.length || 0);
  console.log('Instructions count:', recipe.recipeInstructions?.length || 0);
  console.log('Image type:', typeof recipe.image, Array.isArray(recipe.image) ? `(array of ${recipe.image.length})` : '');
  console.log('First image:', Array.isArray(recipe.image) ? recipe.image[0] : recipe.image);
} else {
  console.log('❌ No recipe found');
}