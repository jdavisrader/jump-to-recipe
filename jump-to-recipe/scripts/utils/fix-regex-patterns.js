// This script will help us fix the regex patterns in the import route

// Common units to look for (in order of specificity)
const units = [
  // Volume - Imperial
  'tablespoons?', 'tablespoon', 'tbsps?', 'tbsp', 'tbs',
  'teaspoons?', 'teaspoon', 'tsps?', 'tsp',
  'fluid ounces?', 'fl\\.?\\s*ozs?', 'fl oz',
  'cups?', 'cup', 'c\\b',
  'pints?', 'pint', 'pt',
  'quarts?', 'quart', 'qt',
  'gallons?', 'gallon', 'gal',

  // Weight - Imperial
  'pounds?', 'pound', 'lbs?', 'lb',
  'ounces?', 'ounce', 'ozs?', 'oz',

  // Volume - Metric
  'milliliters?', 'milliliter', 'mls?', 'ml',
  'liters?', 'liter', 'litres?', 'litre', 'ls?', 'l\\b',

  // Weight - Metric
  'kilograms?', 'kilogram', 'kgs?', 'kg',
  'grams?', 'gram', 'gs?', 'g\\b',

  // Other common units
  'pinch(?:es)?', 'pinch',
  'dash(?:es)?', 'dash',
  'cloves?', 'clove',
  'slices?', 'slice',
  'pieces?', 'piece',
  'cans?', 'can',
  'packages?', 'package', 'pkgs?', 'pkg',
  'bottles?', 'bottle',
  'jars?', 'jar',
  'boxes?', 'box',
  'bags?', 'bag',
];

// Create regex pattern for matching amounts and units
const unitPattern = units.join('|');

// Patterns to match different ingredient formats
const patterns = [
  // Pattern 1: Number + unit + ingredient (e.g., "2 cups all-purpose flour")
  new RegExp(`^([\\d\\/\\-½¼¾⅓⅔⅛⅜⅝⅞\\s]+)\\s*(${unitPattern})\\s+(.+)$`, 'i'),

  // Pattern 2: Number + parenthetical + unit + ingredient (e.g., "1 (14 oz) can diced tomatoes")
  new RegExp(`^([\\d\\/\\-½¼¾⅓⅔⅛⅜⅝⅞\\s]+)\\s*\\([^)]+\\)\\s*(${unitPattern})?\\s*(.+)$`, 'i'),

  // Pattern 3: Number + adjective + ingredient (e.g., "2 large eggs", "3 medium onions")
  new RegExp(`^([\\d\\/\\-½¼¾⅓⅔⅛⅜⅝⅞\\s]+)\\s+(large|medium|small|extra\\s+large)\\s+(.+)$`, 'i'),

  // Pattern 4: Just number + ingredient (e.g., "2 eggs", "3 apples")
  new RegExp(`^([\\d\\/\\-½¼¾⅓⅔⅛⅜⅝⅞\\s]+)\\s+(.+)$`, 'i'),
];

// Test the patterns with some sample ingredients
const testIngredients = [
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
];

console.log("Testing regex patterns with sample ingredients:");
testIngredients.forEach(ingredient => {
  console.log(`\nIngredient: "${ingredient}"`);
  
  let matched = false;
  for (let i = 0; i < patterns.length; i++) {
    const match = ingredient.match(patterns[i]);
    if (match) {
      console.log(`✅ Matched pattern ${i + 1}:`);
      console.log(`  Amount: "${match[1]}"`);
      console.log(`  Unit: "${match[2] || ''}"`);
      console.log(`  Name: "${match[3] || match[2] || ''}"`);
      matched = true;
      break;
    }
  }
  
  if (!matched) {
    console.log("❌ No pattern matched");
  }
});

// Print the fixed regex patterns for use in the code
console.log("\n\nFixed regex patterns for the code:");
console.log("const patterns = [");
patterns.forEach((pattern, index) => {
  console.log(`  // Pattern ${index + 1}`);
  console.log(`  ${pattern.toString()},`);
});
console.log("];");