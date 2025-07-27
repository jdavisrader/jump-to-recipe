import { Recipe, Ingredient, Unit } from '@/types/recipe';
import { 
  GroceryItem, 
  GroceryCategory, 
  INGREDIENT_CATEGORIES
} from '@/types/grocery-list';
import { convertUnit } from './unit-conversion';

/**
 * Categorizes an ingredient based on its name
 */
export function categorizeIngredient(ingredientName: string): GroceryCategory {
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

/**
 * Normalizes ingredient names for better matching
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common descriptors that don't affect the core ingredient
    .replace(/\b(fresh|dried|frozen|canned|organic|raw|cooked)\b/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if two ingredients can be combined
 */
function canCombineIngredients(ingredient1: Ingredient, ingredient2: Ingredient): boolean {
  const name1 = normalizeIngredientName(ingredient1.name);
  const name2 = normalizeIngredientName(ingredient2.name);
  
  // Same normalized name
  if (name1 === name2) {
    return true;
  }
  
  // Check for common variations
  const variations = [
    ['onion', 'onions'],
    ['tomato', 'tomatoes'],
    ['potato', 'potatoes'],
    ['carrot', 'carrots'],
    ['bell pepper', 'bell peppers'],
    ['garlic clove', 'garlic', 'garlic cloves'],
    ['chicken breast', 'chicken breasts', 'chicken'],
    ['olive oil', 'extra virgin olive oil'],
    ['salt', 'sea salt', 'kosher salt'],
    ['black pepper', 'pepper', 'ground black pepper'],
  ];
  
  for (const group of variations) {
    if (group.includes(name1) && group.includes(name2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Combines two ingredients with the same base ingredient
 */
function combineIngredients(ingredient1: Ingredient, ingredient2: Ingredient, recipeIds: string[]): GroceryItem {
  // Try to convert to a common unit for combination
  let totalAmount = ingredient1.amount;
  const combinedUnit = ingredient1.unit;
  let displayAmount: string | undefined;
  
  try {
    // Attempt unit conversion if units are different but compatible
    if (ingredient1.unit !== ingredient2.unit) {
      const converted = convertUnit(ingredient2.amount, ingredient2.unit, ingredient1.unit);
      if (converted !== null) {
        totalAmount += converted;
      } else {
        // If conversion fails, keep separate amounts in display
        displayAmount = `${ingredient1.amount} ${ingredient1.unit} + ${ingredient2.amount} ${ingredient2.unit}`;
        totalAmount = ingredient1.amount; // Keep original for sorting/calculations
      }
    } else {
      totalAmount += ingredient2.amount;
    }
  } catch {
    // If conversion fails, combine as text
    displayAmount = `${ingredient1.amount} ${ingredient1.unit} + ${ingredient2.amount} ${ingredient2.unit}`;
  }
  
  return {
    id: `${ingredient1.id}-${ingredient2.id}`,
    name: ingredient1.name, // Use the first ingredient's name
    amount: totalAmount,
    unit: combinedUnit,
    displayAmount: displayAmount,
    category: categorizeIngredient(ingredient1.name),
    isCompleted: false,
    notes: [ingredient1.notes, ingredient2.notes].filter(Boolean).join('; ') || undefined,
    recipeIds,
  };
}

/**
 * Scales ingredient quantities based on serving size adjustments
 */
function scaleIngredient(ingredient: Ingredient, originalServings: number, newServings: number): Ingredient {
  if (originalServings === 0 || newServings === originalServings) {
    return ingredient;
  }
  
  const scaleFactor = newServings / originalServings;
  
  return {
    ...ingredient,
    amount: ingredient.amount * scaleFactor,
    displayAmount: ingredient.displayAmount 
      ? `${(parseFloat(ingredient.displayAmount) * scaleFactor).toString()}` 
      : undefined,
  };
}

/**
 * Generates a consolidated grocery list from multiple recipes
 */
export function generateGroceryList(
  recipes: Recipe[], 
  servingAdjustments: Record<string, number> = {}
): GroceryItem[] {
  const groceryItemMap = new Map<string, GroceryItem>();
  
  // Process each recipe
  for (const recipe of recipes) {
    const targetServings = servingAdjustments[recipe.id] || recipe.servings || 1;
    const originalServings = recipe.servings || 1;
    
    for (const ingredient of recipe.ingredients) {
      // Scale ingredient if needed
      const scaledIngredient = scaleIngredient(ingredient, originalServings, targetServings);
      const normalizedName = normalizeIngredientName(scaledIngredient.name);
      
      // Convert ingredient to grocery item
      const groceryItem: GroceryItem = {
        id: scaledIngredient.id,
        name: scaledIngredient.name,
        amount: scaledIngredient.amount,
        unit: scaledIngredient.unit,
        displayAmount: scaledIngredient.displayAmount,
        category: categorizeIngredient(scaledIngredient.name),
        isCompleted: false,
        notes: scaledIngredient.notes,
        recipeIds: [recipe.id],
      };

      // Check if we can combine with existing grocery item
      let combined = false;
      for (const [key, existing] of groceryItemMap.entries()) {
        // Only try to combine if the existing item has a valid Unit type (not a combined string)
        if (existing.displayAmount === undefined && canCombineIngredients(scaledIngredient, {
          id: existing.id,
          name: existing.name,
          amount: existing.amount,
          unit: existing.unit as Unit, // Safe cast since displayAmount is undefined
          displayAmount: existing.displayAmount,
          notes: existing.notes,
        })) {
          // Combine ingredients
          const combinedIngredient = combineIngredients(
            {
              id: existing.id,
              name: existing.name,
              amount: existing.amount,
              unit: existing.unit as Unit, // Safe cast since displayAmount is undefined
              displayAmount: existing.displayAmount,
              notes: existing.notes,
            }, 
            scaledIngredient,
            [...existing.recipeIds, recipe.id]
          );
          
          groceryItemMap.set(key, combinedIngredient);
          combined = true;
          break;
        }
      }
      
      // If not combined, add as new grocery item
      if (!combined) {
        groceryItemMap.set(normalizedName, groceryItem);
      }
    }
  }
  
  // Convert to grocery items and sort by category
  const groceryItems: GroceryItem[] = Array.from(groceryItemMap.values());
  
  // Sort by category, then by name
  const categoryOrder: GroceryCategory[] = [
    'produce',
    'meat',
    'seafood',
    'dairy',
    'pantry',
    'spices',
    'condiments',
    'frozen',
    'bakery',
    'beverages',
    'other',
  ];
  
  return groceryItems.sort((a, b) => {
    const categoryComparison = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (categoryComparison !== 0) {
      return categoryComparison;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Generates a default title for a grocery list based on the recipes used
 */
export function generateGroceryListTitle(recipes: Recipe[]): string {
  if (recipes.length === 0) {
    return 'Grocery List';
  }
  
  if (recipes.length === 1) {
    return `Grocery List for ${recipes[0].title}`;
  }
  
  if (recipes.length <= 3) {
    const titles = recipes.map(r => r.title).join(', ');
    return `Grocery List for ${titles}`;
  }
  
  return `Grocery List for ${recipes.length} Recipes`;
}