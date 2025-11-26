// Test script to debug the joyfoodsunshine parsing issue

// Mock JSON-LD data from joyfoodsunshine.com
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

// Test ingredient parsing
function parseIngredientText(text) {
  const cleaned = text.trim();
  
  // Handle count-based ingredients with size descriptors
  // Pattern: "2 large eggs", "3 medium onions", "1 small apple"
  const countWithSizePattern = /^(\d+(?:\.\d+)?)\s+(large|medium|small|extra\s+large|jumbo)\s+(.+)$/i;
  const countWithSizeMatch = cleaned.match(countWithSizePattern);
  
  if (countWithSizeMatch) {
    const amount = parseFloat(countWithSizeMatch[1]);
    const size = countWithSizeMatch[2].toLowerCase();
    const ingredient = countWithSizeMatch[3];
    
    console.log(`✅ Matched count with size: "${cleaned}" → amount: ${amount}, name: "${size} ${ingredient}"`);
    return {
      name: `${size} ${ingredient}`,
      amount: amount,
      unit: '', // Count-based ingredients don't have units
    };
  }
  
  // Handle simple count-based ingredients
  // Pattern: "2 eggs", "3 onions", "1 apple"
  const simpleCountPattern = /^(\d+(?:\.\d+)?)\s+([a-zA-Z][^0-9]*?)s?$/;
  const simpleCountMatch = cleaned.match(simpleCountPattern);
  
  if (simpleCountMatch) {
    const amount = parseFloat(simpleCountMatch[1]);
    const ingredient = simpleCountMatch[2].trim();
    
    // Check if this is likely a count-based ingredient
    const countBasedIngredients = [
      'egg', 'onion', 'apple', 'banana', 'lemon', 'lime', 'orange',
      'potato', 'tomato', 'carrot', 'clove', 'slice', 'piece',
      'can', 'jar', 'bottle', 'package', 'bag', 'box'
    ];
    
    const isCountBased = countBasedIngredients.some(item => 
      ingredient.toLowerCase().includes(item)
    );
    
    if (isCountBased) {
      console.log(`✅ Matched simple count: "${cleaned}" → amount: ${amount}, name: "${ingredient}"`);
      return {
        name: ingredient,
        amount: amount,
        unit: '',
      };
    }
  }
  
  // Handle measured ingredients with fractions
  // Pattern: "2 cups flour", "1/2 tsp salt", "1 1/2 tbsp oil"
  const measuredPattern = /^([\d./\s½¼¾⅓⅔⅛⅜⅝⅞]+)\s*([a-zA-Z]+)\s+(.+)$/;
  const measuredMatch = cleaned.match(measuredPattern);
  
  if (measuredMatch) {
    const amountStr = measuredMatch[1].trim();
    const unitStr = measuredMatch[2].toLowerCase();
    const name = measuredMatch[3].trim();

    // Parse amount (handle fractions like 1/2, mixed numbers like 1 1/2)
    let amount = 1;
    
    // Handle mixed numbers (e.g., "1 1/2")
    const mixedMatch = amountStr.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1]);
      const numerator = parseInt(mixedMatch[2]);
      const denominator = parseInt(mixedMatch[3]);
      amount = whole + (numerator / denominator);
    }
    // Handle simple fractions (e.g., "1/2")
    else if (amountStr.includes('/')) {
      const [numerator, denominator] = amountStr.split('/').map(Number);
      amount = numerator / denominator;
    }
    // Handle unicode fractions
    else if (amountStr.includes('½')) {
      amount = parseFloat(amountStr.replace('½', '.5'));
    } else if (amountStr.includes('¼')) {
      amount = parseFloat(amountStr.replace('¼', '.25'));
    } else if (amountStr.includes('¾')) {
      amount = parseFloat(amountStr.replace('¾', '.75'));
    } else if (amountStr.includes('⅓')) {
      amount = parseFloat(amountStr.replace('⅓', '.333'));
    } else if (amountStr.includes('⅔')) {
      amount = parseFloat(amountStr.replace('⅔', '.667'));
    }
    // Handle decimal numbers
    else {
      amount = parseFloat(amountStr) || 1;
    }

    console.log(`✅ Matched measured: "${cleaned}" → amount: ${amount}, unit: "${unitStr}", name: "${name}"`);
    return {
      name: name,
      amount: amount,
      unit: unitStr,
    };
  }

  // Fallback: treat as a simple ingredient name
  console.log(`⚠️ No match for: "${cleaned}" → treating as name only`);
  return {
    name: cleaned,
    amount: 1,
    unit: '',
  };
}

// Test the recipe extraction
const recipe = findRecipeInGraph(jsonLdData);
if (recipe) {
  console.log('\n📋 Recipe found:');
  console.log('Title:', recipe.name);
  console.log('Ingredients count:', recipe.recipeIngredient?.length || 0);
  console.log('Instructions count:', recipe.recipeInstructions?.length || 0);
  console.log('Image type:', typeof recipe.image, Array.isArray(recipe.image) ? `(array of ${recipe.image.length})` : '');
  console.log('First image:', Array.isArray(recipe.image) ? recipe.image[0] : recipe.image);
  
  // Test ingredient parsing
  console.log('\n🧪 Testing ingredient parsing...');
  recipe.recipeIngredient.forEach((ingredient, index) => {
    console.log(`\nIngredient ${index + 1}: "${ingredient}"`);
    const parsed = parseIngredientText(ingredient);
    console.log(`Result: amount=${parsed.amount}, unit="${parsed.unit}", name="${parsed.name}"`);
  });
} else {
  console.log('❌ No recipe found');
}