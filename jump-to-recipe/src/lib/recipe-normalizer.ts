import { v4 as uuidv4 } from 'uuid';
import { NewRecipeInput, Ingredient, Instruction, Unit } from '@/types/recipe';
import { parseIngredientText } from './recipe-parser';

/**
 * Normalize and clean scraped recipe data
 */
export function normalizeRecipeData(
    scrapedData: { recipe: Partial<NewRecipeInput> },
    authorId: string
): NewRecipeInput {
    const { recipe } = scrapedData;

    // Normalize title
    const title = normalizeTitle(recipe.title || 'Untitled Recipe');

    // Normalize description
    const description = normalizeDescription(recipe.description);

    // Normalize ingredients
    const ingredients = normalizeIngredients(recipe.ingredients || []);

    // Normalize instructions
    const instructions = normalizeInstructions(recipe.instructions || []);

    // Normalize times
    const prepTime = normalizeTime(recipe.prepTime);
    const cookTime = normalizeTime(recipe.cookTime);

    // Normalize servings
    const servings = normalizeServings(recipe.servings);

    // Normalize tags
    const tags = normalizeTags(recipe.tags || []);

    // Normalize notes
    const notes = normalizeNotes(recipe.notes);

    // Normalize image URL
    const imageUrl = normalizeImageUrl(recipe.imageUrl);

    // Normalize source URL
    const sourceUrl = normalizeUrl(recipe.sourceUrl);

    // Ensure we have minimum required data
    if (ingredients.length === 0) {
        ingredients.push({
            id: uuidv4(),
            name: 'Add ingredients here',
            amount: 0,
            unit: '',
        });
    }

    if (instructions.length === 0) {
        instructions.push({
            id: uuidv4(),
            step: 1,
            content: 'Add cooking instructions here',
        });
    }

    return {
        title,
        description,
        ingredients,
        instructions,
        prepTime,
        cookTime,
        servings,
        difficulty: recipe.difficulty || null,
        tags,
        notes,
        imageUrl,
        sourceUrl,
        authorId,
        visibility: recipe.visibility || 'private',
    };
}

/**
 * Normalize recipe title
 */
function normalizeTitle(title: string): string {
    if (!title || typeof title !== 'string') {
        return 'Untitled Recipe';
    }

    // Clean up title
    let normalized = title.trim();

    // Remove common prefixes/suffixes
    const patterns = [
        /^Recipe:\s*/i,
        /^How to make\s*/i,
        /\s*-\s*Recipe$/i,
        /\s*Recipe$/i,
    ];

    patterns.forEach(pattern => {
        normalized = normalized.replace(pattern, '');
    });

    // Capitalize first letter
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    // Limit length
    if (normalized.length > 500) {
        normalized = normalized.substring(0, 497) + '...';
    }

    return normalized || 'Untitled Recipe';
}

/**
 * Normalize recipe description
 */
function normalizeDescription(description?: string | null): string | null {
    if (!description || typeof description !== 'string') {
        return null;
    }

    let normalized = description.trim();

    // Remove excessive whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Limit length
    if (normalized.length > 2000) {
        normalized = normalized.substring(0, 1997) + '...';
    }

    return normalized || null;
}

/**
 * Normalize ingredients array
 */
function normalizeIngredients(ingredients: unknown[]): Ingredient[] {
    if (!Array.isArray(ingredients)) {
        return [];
    }

    return ingredients
        .map((ingredient) => {
            // Handle string ingredients (from HTML parsing)
            if (typeof ingredient === 'string') {
                const parsed = parseIngredientText(ingredient);
                return {
                    id: uuidv4(),
                    name: parsed.name || ingredient.trim(),
                    amount: parsed.amount || 0,
                    unit: (parsed.unit as Unit) || '',
                    notes: '',
                    category: '',
                } as Ingredient;
            }

            // Handle object ingredients
            if (typeof ingredient === 'object' && ingredient !== null) {
                const ingredientObj = ingredient as Record<string, unknown>;
                return {
                    id: (ingredientObj.id as string) || uuidv4(),
                    name: normalizeIngredientName(ingredientObj.name),
                    amount: normalizeAmount(ingredientObj.amount),
                    unit: normalizeUnit(ingredientObj.unit),
                    notes: normalizeNotes(ingredientObj.notes) || '',
                    category: normalizeCategory(ingredientObj.category),
                } as Ingredient;
            }

            return null;
        })
        .filter((ingredient): ingredient is Ingredient => ingredient !== null)
        .filter(ingredient => ingredient.name.trim().length > 0);
}

/**
 * Normalize ingredient name
 */
function normalizeIngredientName(name: unknown): string {
    if (!name || typeof name !== 'string') {
        return 'Unknown ingredient';
    }

    let normalized = name.trim();

    // Remove excessive whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Capitalize first letter
    normalized = normalized.charAt(0).toLowerCase() + normalized.slice(1);

    return normalized || 'Unknown ingredient';
}

/**
 * Normalize ingredient amount
 */
function normalizeAmount(amount: unknown): number {
    if (typeof amount === 'number' && !isNaN(amount) && amount >= 0) {
        return Math.round(amount * 100) / 100; // Round to 2 decimal places
    }

    if (typeof amount === 'string') {
        // Handle fractions
        if (amount.includes('/')) {
            const [numerator, denominator] = amount.split('/').map(Number);
            if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                return Math.round((numerator / denominator) * 100) / 100;
            }
        }

        const parsed = parseFloat(amount);
        if (!isNaN(parsed) && parsed >= 0) {
            return Math.round(parsed * 100) / 100;
        }
    }

    return 0;
}

/**
 * Normalize ingredient unit
 */
function normalizeUnit(unit: unknown): Unit {
    if (!unit || typeof unit !== 'string') {
        return '';
    }

    const normalized = unit.toLowerCase().trim();

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
        'fl oz': 'fl oz',
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

    return unitMap[normalized] || '';
}

/**
 * Normalize ingredient category
 */
function normalizeCategory(category: unknown): string {
    if (!category || typeof category !== 'string') {
        return '';
    }

    return category.trim().toLowerCase();
}

/**
 * Normalize instructions array
 */
function normalizeInstructions(instructions: unknown[]): Instruction[] {
    if (!Array.isArray(instructions)) {
        return [];
    }

    return instructions
        .map((instruction, index) => {
            // Handle string instructions
            if (typeof instruction === 'string') {
                const content = instruction.trim();
                if (content.length === 0) return null;

                return {
                    id: uuidv4(),
                    step: index + 1,
                    content: normalizeInstructionContent(content),
                    duration: undefined,
                } as Instruction;
            }

            // Handle object instructions
            if (typeof instruction === 'object' && instruction !== null) {
                const instructionObj = instruction as Record<string, unknown>;
                const content = normalizeInstructionContent(instructionObj.content || instructionObj.text || '');
                if (content.length === 0) return null;

                return {
                    id: (instructionObj.id as string) || uuidv4(),
                    step: (instructionObj.step as number) || index + 1,
                    content,
                    duration: normalizeTime(instructionObj.duration),
                } as Instruction;
            }

            return null;
        })
        .filter((instruction): instruction is Instruction => instruction !== null);
}

/**
 * Normalize instruction content
 */
function normalizeInstructionContent(content: unknown): string {
    if (!content || typeof content !== 'string') {
        return '';
    }

    let normalized = content.trim();

    // Remove excessive whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Remove step numbers if they exist at the beginning
    normalized = normalized.replace(/^\d+\.\s*/, '');

    // Capitalize first letter
    if (normalized.length > 0) {
        normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    return normalized;
}

/**
 * Normalize time values (in minutes)
 */
function normalizeTime(time: unknown): number | null {
    if (typeof time === 'number' && !isNaN(time) && time > 0) {
        return Math.round(time);
    }

    if (typeof time === 'string') {
        const parsed = parseInt(time);
        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return null;
}

/**
 * Normalize servings
 */
function normalizeServings(servings: unknown): number | null {
    if (typeof servings === 'number' && !isNaN(servings) && servings > 0) {
        return Math.round(servings);
    }

    if (typeof servings === 'string') {
        const parsed = parseInt(servings);
        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return null;
}

/**
 * Normalize tags array
 */
function normalizeTags(tags: unknown[]): string[] {
    if (!Array.isArray(tags)) {
        return [];
    }

    return tags
        .map(tag => {
            if (typeof tag === 'string') {
                return tag.trim().toLowerCase();
            }
            return null;
        })
        .filter((tag): tag is string => tag !== null && tag.length > 0)
        .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
        .slice(0, 20); // Limit to 20 tags
}

/**
 * Normalize notes
 */
function normalizeNotes(notes: unknown): string | null {
    if (!notes || typeof notes !== 'string') {
        return null;
    }

    let normalized = notes.trim();

    // Remove excessive whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Limit length
    if (normalized.length > 2000) {
        normalized = normalized.substring(0, 1997) + '...';
    }

    return normalized || null;
}

/**
 * Normalize image URL
 */
function normalizeImageUrl(imageUrl: unknown): string | null {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }

    const trimmed = imageUrl.trim();

    // Basic URL validation
    try {
        new URL(trimmed);
        return trimmed;
    } catch {
        return null;
    }
}

/**
 * Normalize URL
 */
function normalizeUrl(url: unknown): string | null {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const trimmed = url.trim();

    // Basic URL validation
    try {
        new URL(trimmed);
        return trimmed;
    } catch {
        return null;
    }
}