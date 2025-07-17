// Application constants

export const APP_NAME = 'Jump to Recipe';
export const APP_DESCRIPTION = 'A modern platform for collecting, organizing, and sharing digital cookbooks';

// Recipe difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

// Common recipe tags
export const COMMON_TAGS = [
  'breakfast',
  'lunch',
  'dinner',
  'dessert',
  'snack',
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'quick',
  'healthy',
  'comfort-food',
  'holiday',
  'party',
] as const;

// Grocery list categories
export const GROCERY_CATEGORIES = [
  'produce',
  'meat',
  'dairy',
  'pantry',
  'frozen',
  'bakery',
  'beverages',
  'other',
] as const;

// Time limits for recipes (in minutes)
export const TIME_LIMITS = {
  PREP_TIME_MAX: 480, // 8 hours
  COOK_TIME_MAX: 720, // 12 hours
  SERVINGS_MAX: 50,
} as const;

// Validation constants
export const VALIDATION = {
  RECIPE_TITLE_MIN: 3,
  RECIPE_TITLE_MAX: 100,
  RECIPE_DESCRIPTION_MAX: 500,
  COOKBOOK_TITLE_MIN: 3,
  COOKBOOK_TITLE_MAX: 100,
  COOKBOOK_DESCRIPTION_MAX: 500,
  INGREDIENT_MAX: 50,
  INSTRUCTION_MAX: 50,
} as const;