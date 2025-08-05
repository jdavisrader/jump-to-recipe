import { v4 as uuidv4 } from 'uuid';
import { Ingredient, Instruction, NewRecipeInput, Unit } from '@/types/recipe';

/**
 * Interface for JSON-LD Recipe schema
 * Based on https://schema.org/Recipe
 */
interface JsonLdRecipe {
    '@type': 'Recipe';
    name: string;
    description?: string;
    recipeIngredient?: string[];
    recipeInstructions?: (string | { '@type': 'HowToStep'; text: string })[];
    prepTime?: string; // ISO 8601 duration format
    cookTime?: string; // ISO 8601 duration format
    recipeYield?: string | number | string[];
    keywords?: string;
    image?: string | string[] | { '@type': 'ImageObject'; url: string } | { '@type': 'ImageObject'; url: string }[];
    author?: { '@type': 'Person'; name: string };
    datePublished?: string;
    nutrition?: {
        '@type': 'NutritionInformation';
        calories?: string;
        fatContent?: string;
        // other nutrition properties
    };
}

/**
 * Parse ISO 8601 duration format to minutes
 * Example: PT1H30M -> 90 minutes
 */
export function parseIsoDuration(duration: string): number | undefined {
    if (!duration) return undefined;

    const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return undefined;

    const days = parseInt(matches[1] || '0');
    const hours = parseInt(matches[2] || '0');
    const minutes = parseInt(matches[3] || '0');
    const seconds = parseInt(matches[4] || '0');

    return days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
}

/**
 * Parse ingredient text to extract amount, unit, and name
 * Example: "2 cups flour" -> { amount: 2, unit: "cup", name: "flour" }
 * Example: "2 large eggs" -> { amount: 2, unit: "", name: "large eggs" }
 */
export function parseIngredientText(text: string): Partial<Ingredient> {
    const cleaned = text.trim();

    // Handle count-based ingredients (eggs, onions, etc.) with size descriptors
    // Pattern: "2 large eggs", "3 medium onions", "1 small apple"
    const countWithSizePattern = /^(\d+(?:\.\d+)?)\s+(large|medium|small|extra\s+large|jumbo)\s+(.+)$/i;
    const countWithSizeMatch = cleaned.match(countWithSizePattern);

    if (countWithSizeMatch) {
        const amount = parseFloat(countWithSizeMatch[1]);
        const size = countWithSizeMatch[2].toLowerCase();
        const ingredient = countWithSizeMatch[3];

        return {
            id: uuidv4(),
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
            return {
                id: uuidv4(),
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
        let amount: number = 1;

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

        // Normalize unit to match our schema
        const unitMap: Record<string, Unit> = {
            // Metric
            'g': 'g', 'gram': 'g', 'grams': 'g',
            'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
            'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
            'l': 'l', 'liter': 'l', 'liters': 'l',

            // Imperial - teaspoons
            'tsp': 'tsp',
            'teaspoon': 'tsp',
            'teaspoons': 'tsp',
            't': 'tsp',

            // Imperial - tablespoons
            'tbsp': 'tbsp',
            'tablespoon': 'tbsp',
            'tablespoons': 'tbsp',
            'T': 'tbsp',
            'tbs': 'tbsp',

            // Imperial - cups
            'cup': 'cup',
            'cups': 'cup',
            'c': 'cup',

            // Imperial - weight
            'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
            'lb': 'lb', 'pound': 'lb', 'pounds': 'lb',

            // Other
            'pinch': 'pinch', 'pinches': 'pinch',
            'dash': 'pinch', 'dashes': 'pinch',

            // Fluid ounces
            'fl oz': 'fl oz',
            'fl': 'fl oz',
            'fluid': 'fl oz',
            'fluid oz': 'fl oz',
            'fluid ounce': 'fl oz',
            'fluid ounces': 'fl oz',

            // Volume
            'pint': 'pint', 'pints': 'pint', 'pt': 'pint',
            'quart': 'quart', 'quarts': 'quart', 'qt': 'quart',
            'gallon': 'gallon', 'gallons': 'gallon', 'gal': 'gallon',
        };

        const unit = unitMap[unitStr] || '';

        return {
            id: uuidv4(),
            name: name,
            amount: amount,
            unit: unit,
        };
    }

    // Fallback: treat as a simple ingredient name
    return {
        id: uuidv4(),
        name: cleaned,
        amount: 1,
        unit: '',
    };
}

/**
 * Parse JSON-LD recipe data into our application's recipe format
 */
export function parseJsonLdRecipe(jsonLd: JsonLdRecipe, authorId: string): NewRecipeInput {
    // Parse ingredients
    const ingredients: Ingredient[] = (jsonLd.recipeIngredient || []).map((text) => {
        const parsed = parseIngredientText(text);
        return {
            id: uuidv4(),
            name: parsed.name || '',
            amount: parsed.amount || 0,
            unit: parsed.unit || '',
            notes: '',
            category: '',
        };
    });

    // Parse instructions
    const instructions: Instruction[] = (jsonLd.recipeInstructions || []).map((instruction, index) => {
        const text = typeof instruction === 'string' ? instruction : instruction.text;
        return {
            id: uuidv4(),
            step: index + 1,
            content: text,
        };
    });

    // Parse image URL
    let imageUrl: string | undefined;
    if (typeof jsonLd.image === 'string') {
        imageUrl = jsonLd.image;
    } else if (Array.isArray(jsonLd.image)) {
        // Handle array of strings or objects
        if (typeof jsonLd.image[0] === 'string') {
            imageUrl = jsonLd.image[0];
        } else if (jsonLd.image[0]?.url) {
            imageUrl = jsonLd.image[0].url;
        }
    } else if (jsonLd.image && typeof jsonLd.image === 'object' && 'url' in jsonLd.image) {
        imageUrl = jsonLd.image.url;
    }

    // Create recipe object
    return {
        title: jsonLd.name,
        description: jsonLd.description || null,
        ingredients,
        instructions,
        prepTime: parseIsoDuration(jsonLd.prepTime || '') || null,
        cookTime: parseIsoDuration(jsonLd.cookTime || '') || null,
        servings: (() => {
            if (typeof jsonLd.recipeYield === 'string') {
                return parseInt(jsonLd.recipeYield) || null;
            } else if (typeof jsonLd.recipeYield === 'number') {
                return jsonLd.recipeYield;
            } else if (Array.isArray(jsonLd.recipeYield) && jsonLd.recipeYield.length > 0) {
                // Handle array like ["36", "36 cookies"] - take the first numeric value
                const firstYield = jsonLd.recipeYield[0];
                return typeof firstYield === 'string' ? parseInt(firstYield) || null : firstYield;
            }
            return null;
        })(),
        tags: jsonLd.keywords?.split(',').map(tag => tag.trim()) || [],
        imageUrl: imageUrl || null,
        authorId,
        visibility: 'private',
        notes: null,
        difficulty: null,
        sourceUrl: null,
        commentsEnabled: true,
        viewCount: 0,
        likeCount: 0,
    };
}

/**
 * Extract JSON-LD recipe data from HTML string
 */
export function extractJsonLdFromHtml(html: string): JsonLdRecipe | null {
    try {
        // Find JSON-LD script tags
        const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;

        while ((match = scriptRegex.exec(html)) !== null) {
            const jsonContent = match[1].trim();
            const jsonData = JSON.parse(jsonContent);

            // Handle both direct Recipe objects and objects with @graph
            if (jsonData['@type'] === 'Recipe') {
                return jsonData as JsonLdRecipe;
            } else if (jsonData['@graph']) {
                // Find Recipe in graph
                const recipe = jsonData['@graph'].find((item: unknown) =>
                    typeof item === 'object' && item !== null &&
                    '@type' in item && item['@type'] === 'Recipe'
                );
                if (recipe) {
                    return recipe as JsonLdRecipe;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error extracting JSON-LD:', error);
        return null;
    }
}