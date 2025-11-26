// Test the grocery list generation logic directly
const { generateGroceryList, generateGroceryListTitle, categorizeIngredient } = require('./src/lib/grocery-list-generator');

// Mock recipe data for testing
const mockRecipes = [
  {
    id: 'recipe-1',
    title: 'Spaghetti Carbonara',
    servings: 4,
    ingredients: [
      { id: 'ing-1', name: 'spaghetti', amount: 1, unit: 'lb' },
      { id: 'ing-2', name: 'eggs', amount: 4, unit: '' },
      { id: 'ing-3', name: 'parmesan cheese', amount: 1, unit: 'cup' },
      { id: 'ing-4', name: 'bacon', amount: 6, unit: 'oz' },
      { id: 'ing-5', name: 'black pepper', amount: 1, unit: 'tsp' },
    ]
  },
  {
    id: 'recipe-2',
    title: 'Caesar Salad',
    servings: 2,
    ingredients: [
      { id: 'ing-6', name: 'romaine lettuce', amount: 1, unit: 'head' },
      { id: 'ing-7', name: 'parmesan cheese', amount: 0.5, unit: 'cup' },
      { id: 'ing-8', name: 'croutons', amount: 1, unit: 'cup' },
      { id: 'ing-9', name: 'caesar dressing', amount: 0.25, unit: 'cup' },
      { id: 'ing-10', name: 'lemon', amount: 1, unit: '' },
    ]
  }
];

function testIngredientCategorization() {
  console.log('🧪 Testing ingredient categorization...');
  
  const testCases = [
    { ingredient: 'milk', expected: 'dairy' },
    { ingredient: 'chicken breast', expected: 'meat' },
    { ingredient: 'tomato', expected: 'produce' },
    { ingredient: 'flour', expected: 'pantry' },
    { ingredient: 'salt', expected: 'spices' },
    { ingredient: 'olive oil', expected: 'condiments' },
    { ingredient: 'unknown ingredient', expected: 'other' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ ingredient, expected }) => {
    const result = categorizeIngredient(ingredient);
    if (result === expected) {
      console.log(`✅ ${ingredient} -> ${result}`);
      passed++;
    } else {
      console.log(`❌ ${ingredient} -> ${result} (expected ${expected})`);
      failed++;
    }
  });
  
  console.log(`Categorization tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

function testGroceryListGeneration() {
  console.log('🧪 Testing grocery list generation...');
  
  try {
    // Test basic generation
    const groceryList = generateGroceryList(mockRecipes);
    
    console.log('Generated grocery list:');
    groceryList.forEach(item => {
      console.log(`- ${item.name}: ${item.amount} ${item.unit} (${item.category})`);
    });
    
    // Test that parmesan cheese was combined
    const parmesanItems = groceryList.filter(item => 
      item.name.toLowerCase().includes('parmesan')
    );
    
    if (parmesanItems.length === 1) {
      console.log('✅ Parmesan cheese was successfully combined');
      console.log(`   Combined amount: ${parmesanItems[0].amount} ${parmesanItems[0].unit}`);
    } else {
      console.log('❌ Parmesan cheese was not combined properly');
      return false;
    }
    
    // Test serving size adjustments
    console.log('\n🧪 Testing serving size adjustments...');
    const adjustedList = generateGroceryList(mockRecipes, {
      'recipe-1': 8, // Double the servings
      'recipe-2': 4  // Double the servings
    });
    
    console.log('Adjusted grocery list:');
    adjustedList.forEach(item => {
      console.log(`- ${item.name}: ${item.amount} ${item.unit} (${item.category})`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in grocery list generation:', error);
    return false;
  }
}

function testTitleGeneration() {
  console.log('🧪 Testing title generation...');
  
  const testCases = [
    { recipes: [], expected: 'Grocery List' },
    { recipes: [mockRecipes[0]], expected: 'Grocery List for Spaghetti Carbonara' },
    { recipes: mockRecipes, expected: 'Grocery List for Spaghetti Carbonara, Caesar Salad' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(({ recipes, expected }) => {
    const result = generateGroceryListTitle(recipes);
    if (result === expected) {
      console.log(`✅ ${recipes.length} recipes -> "${result}"`);
      passed++;
    } else {
      console.log(`❌ ${recipes.length} recipes -> "${result}" (expected "${expected}")`);
      failed++;
    }
  });
  
  console.log(`Title generation tests: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

async function runTests() {
  console.log('🧪 Starting Grocery List Logic Tests\n');
  
  const results = [
    testIngredientCategorization(),
    testTitleGeneration(),
    testGroceryListGeneration(),
  ];
  
  const allPassed = results.every(result => result);
  
  console.log('\n🏁 Test Results:');
  if (allPassed) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
  
  return allPassed;
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testIngredientCategorization,
    testGroceryListGeneration,
    testTitleGeneration,
    runTests
  };
} else {
  // Run tests if called directly
  runTests();
}