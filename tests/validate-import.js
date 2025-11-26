// Test script to validate recipe data against our schema

const { z } = require('zod');

// Define the schema (copied from our validation file)
const unitSchema = z.enum([
  // Metric
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pinch',
  // Imperial
  'oz', 'lb', 'fl oz', 'pint', 'quart', 'gallon',
  // Empty unit (for items like "1 apple")
  ''
]);

const ingredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().nonnegative('Amount must be non-negative').default(0),
  unit: unitSchema.default(''),
  notes: z.string().optional(),
  category: z.string().optional(),
});

// Mock ingredients from the joyfoodsunshine recipe
const ingredients = [
  {
    id: "ing-1",
    name: "salted butter (softened)",
    amount: 1,
    unit: "cup",
    notes: ""
  },
  {
    id: "ing-2",
    name: "granulated sugar",
    amount: 1,
    unit: "cup",
    notes: ""
  },
  {
    id: "ing-3",
    name: "light brown sugar (packed)",
    amount: 1,
    unit: "cup",
    notes: ""
  },
  {
    id: "ing-4",
    name: "pure vanilla extract",
    amount: 2,
    unit: "teaspoons", // This might be the issue - should be "tsp"
    notes: ""
  },
  {
    id: "ing-5",
    name: "large eggs",
    amount: 2,
    unit: "",
    notes: ""
  },
  {
    id: "ing-6",
    name: "all-purpose flour",
    amount: 3,
    unit: "cups", // This might be the issue - should be "cup"
    notes: ""
  },
  {
    id: "ing-7",
    name: "baking soda",
    amount: 1,
    unit: "teaspoon", // This might be the issue - should be "tsp"
    notes: ""
  },
  {
    id: "ing-8",
    name: "baking powder",
    amount: 0.5,
    unit: "teaspoon", // This might be the issue - should be "tsp"
    notes: ""
  },
  {
    id: "ing-9",
    name: "sea salt",
    amount: 1,
    unit: "teaspoon", // This might be the issue - should be "tsp"
    notes: ""
  },
  {
    id: "ing-10",
    name: "chocolate chips ((12 oz))",
    amount: 2,
    unit: "cups", // This might be the issue - should be "cup"
    notes: ""
  }
];

// Validate each ingredient
console.log('🧪 Testing ingredient validation...\n');
ingredients.forEach((ingredient, index) => {
  try {
    console.log(`\nIngredient ${index + 1}: "${ingredient.name}"`);
    console.log(`Amount: ${ingredient.amount}, Unit: "${ingredient.unit}"`);
    
    const result = ingredientSchema.parse(ingredient);
    console.log('✅ Valid ingredient');
  } catch (error) {
    console.log('❌ Invalid ingredient:');
    console.log(error.errors);
  }
});