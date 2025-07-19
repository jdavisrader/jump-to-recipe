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
    recipeYield?: string | number;
    keywords?: string;
    image?: string | { '@type': 'ImageObject'; url: string }[];
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
 */
export function parseIngredientText(text: string): Partial<Ingredient> {
    // Basic regex to extract amount, unit, and name
    const regex = /^([\d./]+)?\s*([a-zA-Z]+)?\s*(.+)$/;
    const matches = text.trim().match(regex);

    if (!matches) {
        return { name: text.trim(), amount: undefined, unit: '' };
    }

    const amountStr = matches[1];
    const unitStr = matches[2]?.toLowerCase();
    const name = matches[3]?.trim();

    // Parse amount (handle fractions like 1/2)
    let amount: number | undefined = undefined;
    if (amountStr) {
        if (amountStr.includes('/')) {
            const [numerator, denominator] = amountStr.split('/').map(Number);
            amount = numerator / denominator;
        } else {
            amount = parseFloat(amountStr);
        }
    }

    // Normalize unit
    let unit: Unit = '';
    if (unitStr) {
        // Map common unit variations
        const unitMap: Record<string, Unit> = {
            'g': 'g',
            'gram': 'g',
            'grams': 'g',
            'kg': 'kg',
            'kilogram': 'kg',
            'kilograms': 'kg',
            'ml': 'ml',
            'milliliter': 'ml',
            'milliliters': 'ml',
            'l': 'l',
            'liter': 'l',
            'liters': 'l',
            'tsp': 'tsp',
            'teaspoon': 'tsp',
            'teaspoons': 'tsp',
            'tbsp': 'tbsp',
            'tablespoon': 'tbsp',
            'tablespoons': 'tbsp',
            'cup': 'cup',
            'cups': 'cup',
            'oz': 'oz',
            'ounce': 'oz',
            'ounces': 'oz',
            'lb': 'lb',
            'pound': 'lb',
            'pounds': 'lb',
            'pinch': 'pinch',
            'pinches': 'pinch',
            'fl': 'fl oz',
            'fluid': 'fl oz',
            'fluid oz': 'fl oz',
            'fluid ounce': 'fl oz',
            'fluid ounces': 'fl oz',
            'pint': 'pint',
            'pints': 'pint',
            'quart': 'quart',
            'quarts': 'quart',
            'gallon': 'gallon',
            'gallons': 'gallon',
        };

        unit = unitMap[unitStr] || '';
    }

    return {
        id: uuidv4(),
        name: name || text.trim(),
        amount,
        unit,
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
    } else if (Array.isArray(jsonLd.image) && jsonLd.image[0]?.url) {
        imageUrl = jsonLd.image[0].url;
    }

    // Create recipe object
    return {
        title: jsonLd.name,
        description: jsonLd.description,
        ingredients,
        instructions,
        prepTime: parseIsoDuration(jsonLd.prepTime || ''),
        cookTime: parseIsoDuration(jsonLd.cookTime || ''),
        servings: typeof jsonLd.recipeYield === 'string'
            ? parseInt(jsonLd.recipeYield) || undefined
            : jsonLd.recipeYield,
        tags: jsonLd.keywords?.split(',').map(tag => tag.trim()) || [],
        imageUrl,
        authorId,
        visibility: 'private',
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