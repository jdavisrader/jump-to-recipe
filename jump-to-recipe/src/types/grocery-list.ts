// Grocery list types and interfaces

export interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  displayAmount?: string; // Original fraction format for display
  category: GroceryCategory;
  isCompleted: boolean;
  notes?: string;
  recipeIds: string[]; // Track which recipes contributed to this item
}

export type GroceryCategory = 
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'pantry'
  | 'spices'
  | 'condiments'
  | 'frozen'
  | 'bakery'
  | 'beverages'
  | 'other';

export interface GroceryList {
  id: string;
  title: string;
  items: GroceryItem[];
  userId: string;
  generatedFrom: string[]; // Recipe IDs used to generate this list
  createdAt: Date;
  updatedAt: Date;
}

export type NewGroceryList = Omit<GroceryList, 'id' | 'createdAt' | 'updatedAt'>;

export interface GroceryListGenerationRequest {
  recipeIds: string[];
  servingAdjustments?: Record<string, number>; // recipeId -> new serving size
  title?: string;
}

export interface GroceryListUpdateRequest {
  title?: string;
  items?: GroceryItem[];
}

// Category mapping for ingredient categorization
export const INGREDIENT_CATEGORIES: Record<string, GroceryCategory> = {
  // Produce
  'apple': 'produce',
  'banana': 'produce',
  'orange': 'produce',
  'lemon': 'produce',
  'lime': 'produce',
  'onion': 'produce',
  'garlic': 'produce',
  'tomato': 'produce',
  'potato': 'produce',
  'carrot': 'produce',
  'celery': 'produce',
  'bell pepper': 'produce',
  'mushroom': 'produce',
  'spinach': 'produce',
  'lettuce': 'produce',
  'cucumber': 'produce',
  'avocado': 'produce',
  'broccoli': 'produce',
  'cauliflower': 'produce',
  'zucchini': 'produce',
  'ginger': 'produce',
  'herbs': 'produce',
  'parsley': 'produce',
  'cilantro': 'produce',
  'basil': 'produce',
  'mint': 'produce',

  // Dairy
  'milk': 'dairy',
  'butter': 'dairy',
  'cheese': 'dairy',
  'cream': 'dairy',
  'yogurt': 'dairy',
  'sour cream': 'dairy',
  'cottage cheese': 'dairy',
  'cream cheese': 'dairy',
  'mozzarella': 'dairy',
  'cheddar': 'dairy',
  'parmesan': 'dairy',
  'eggs': 'dairy',

  // Meat
  'chicken': 'meat',
  'beef': 'meat',
  'pork': 'meat',
  'turkey': 'meat',
  'lamb': 'meat',
  'bacon': 'meat',
  'sausage': 'meat',
  'ham': 'meat',
  'ground beef': 'meat',
  'ground turkey': 'meat',
  'ground chicken': 'meat',

  // Seafood
  'salmon': 'seafood',
  'tuna': 'seafood',
  'shrimp': 'seafood',
  'cod': 'seafood',
  'tilapia': 'seafood',
  'crab': 'seafood',
  'lobster': 'seafood',
  'scallops': 'seafood',
  'mussels': 'seafood',

  // Pantry
  'flour': 'pantry',
  'sugar': 'pantry',
  'brown sugar': 'pantry',
  'rice': 'pantry',
  'pasta': 'pantry',
  'oats': 'pantry',
  'quinoa': 'pantry',
  'beans': 'pantry',
  'lentils': 'pantry',
  'chickpeas': 'pantry',
  'black beans': 'pantry',
  'kidney beans': 'pantry',
  'canned tomatoes': 'pantry',
  'tomato sauce': 'pantry',
  'tomato paste': 'pantry',
  'broth': 'pantry',
  'stock': 'pantry',
  'coconut milk': 'pantry',
  'nuts': 'pantry',
  'almonds': 'pantry',
  'walnuts': 'pantry',
  'pecans': 'pantry',
  'peanuts': 'pantry',
  'seeds': 'pantry',

  // Spices
  'salt': 'spices',
  'pepper': 'spices',
  'black pepper': 'spices',
  'paprika': 'spices',
  'cumin': 'spices',
  'oregano': 'spices',
  'thyme': 'spices',
  'rosemary': 'spices',
  'sage': 'spices',
  'cinnamon': 'spices',
  'nutmeg': 'spices',
  'garam masala': 'spices',
  'curry powder': 'spices',
  'chili powder': 'spices',
  'red pepper flakes': 'spices',
  'garlic powder': 'spices',
  'onion powder': 'spices',
  'bay leaves': 'spices',

  // Condiments
  'olive oil': 'condiments',
  'vegetable oil': 'condiments',
  'coconut oil': 'condiments',
  'vinegar': 'condiments',
  'balsamic vinegar': 'condiments',
  'apple cider vinegar': 'condiments',
  'soy sauce': 'condiments',
  'worcestershire sauce': 'condiments',
  'hot sauce': 'condiments',
  'mustard': 'condiments',
  'ketchup': 'condiments',
  'mayonnaise': 'condiments',
  'honey': 'condiments',
  'maple syrup': 'condiments',
  'vanilla extract': 'condiments',
  'lemon juice': 'condiments',
  'lime juice': 'condiments',

  // Frozen
  'frozen vegetables': 'frozen',
  'frozen fruit': 'frozen',
  'ice cream': 'frozen',
  'frozen pizza': 'frozen',

  // Bakery
  'bread': 'bakery',
  'rolls': 'bakery',
  'bagels': 'bakery',
  'tortillas': 'bakery',
  'pita bread': 'bakery',

  // Beverages
  'water': 'beverages',
  'juice': 'beverages',
  'coffee': 'beverages',
  'tea': 'beverages',
  'soda': 'beverages',
  'wine': 'beverages',
  'beer': 'beverages',
};