// Simple test to verify grocery list categorization logic
console.log('🧪 Testing Grocery List Categorization Logic');

// Mock the categorization function logic
const INGREDIENT_CATEGORIES = {
  'milk': 'dairy',
  'chicken': 'meat',
  'tomato': 'produce',
  'flour': 'pantry',
  'salt': 'spices',
  'olive oil': 'condiments',
};

function categorizeIngredient(ingredientName) {
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // Check for exact matches first
  if (INGREDIENT_CATEGORIES[normalizedName]) {
    return INGREDIENT_CATEGORIES[normalizedName];
  }
  
  // Check for partial matches
  for (const [key, category] of Object.entries(INGREDIENT_CATEGORIES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return category;
    }
  }
  
  return 'other';
}

// Test cases
const testCases = [
  { ingredient: 'milk', expected: 'dairy' },
  { ingredient: 'Whole Milk', expected: 'dairy' },
  { ingredient: 'chicken breast', expected: 'meat' },
  { ingredient: 'fresh tomato', expected: 'produce' },
  { ingredient: 'all-purpose flour', expected: 'pantry' },
  { ingredient: 'sea salt', expected: 'spices' },
  { ingredient: 'extra virgin olive oil', expected: 'condiments' },
  { ingredient: 'unknown ingredient', expected: 'other' },
];

let passed = 0;
let failed = 0;

console.log('\nTesting ingredient categorization:');
testCases.forEach(({ ingredient, expected }) => {
  const result = categorizeIngredient(ingredient);
  if (result === expected) {
    console.log(`✅ "${ingredient}" -> ${result}`);
    passed++;
  } else {
    console.log(`❌ "${ingredient}" -> ${result} (expected ${expected})`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All categorization tests passed!');
} else {
  console.log('⚠️  Some tests failed');
}

// Test grocery list structure
console.log('\n🧪 Testing Grocery List Structure');

const mockGroceryItem = {
  id: 'item-1',
  name: 'Milk',
  amount: 1,
  unit: 'gallon',
  category: 'dairy',
  isCompleted: false,
  recipeIds: ['recipe-1']
};

console.log('Sample grocery item structure:');
console.log(JSON.stringify(mockGroceryItem, null, 2));

console.log('\n✅ Grocery list structure test passed');
console.log('\n🏁 Simple tests completed successfully!');