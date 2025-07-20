import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';
import type { Recipe } from '@/types/recipe';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JumpToRecipe/1.0; +https://jumptorecipe.com)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch the webpage' },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract recipe data using JSON-LD structured data first
    let recipeData = extractJsonLdRecipe($);

    // If JSON-LD fails, try microdata
    if (!recipeData) {
      recipeData = extractMicrodataRecipe($);
    }

    // If both fail, try basic HTML scraping
    if (!recipeData) {
      recipeData = extractBasicRecipe($, url);
    }

    // Ensure we have at least one ingredient and instruction
    const ingredients = recipeData.ingredients && recipeData.ingredients.length > 0
      ? recipeData.ingredients
      : [{
        id: uuidv4(),
        name: 'Ingredient information not available',
        amount: 1,
        unit: '',
        notes: 'Please edit this recipe to add proper ingredients',
      }];

    const instructions = recipeData.instructions && recipeData.instructions.length > 0
      ? recipeData.instructions
      : [{
        id: uuidv4(),
        step: 1,
        content: 'Instructions not available. Please edit this recipe to add proper instructions.',
        duration: undefined,
      }];

    // Create a mock recipe object that matches our Recipe type
    const recipe: Recipe = {
      id: uuidv4(),
      title: recipeData.title || 'Imported Recipe',
      description: recipeData.description || '',
      ingredients,
      instructions,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty,
      tags: recipeData.tags || [],
      notes: recipeData.notes || '',
      imageUrl: recipeData.imageUrl || '',
      sourceUrl: url,
      authorId: 'imported-recipe',
      visibility: 'private',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Recipe import error:', error);
    return NextResponse.json(
      { error: 'Failed to import recipe' },
      { status: 500 }
    );
  }
}

function extractJsonLdRecipe($: cheerio.CheerioAPI) {
  try {
    const jsonLdScripts = $('script[type="application/ld+json"]');

    for (let i = 0; i < jsonLdScripts.length; i++) {
      const script = jsonLdScripts.eq(i);
      const jsonText = script.html();

      if (!jsonText) continue;

      try {
        const data = JSON.parse(jsonText);
        const recipes = Array.isArray(data) ? data : [data];

        for (const item of recipes) {
          if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
            return parseJsonLdRecipe(item);
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse JSON-LD:', parseError);
      }
    }
  } catch (error) {
    console.warn('JSON-LD extraction failed:', error);
  }

  return null;
}

function parseJsonLdRecipe(recipe: any) {
  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? recipe.recipeIngredient.map((ingredient: string, index: number) => {
      const parsed = parseIngredientString(ingredient);
      return {
        id: uuidv4(),
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
        displayAmount: parsed.displayAmount,
        notes: parsed.notes,
      };
    })
    : [];

  const instructions = Array.isArray(recipe.recipeInstructions)
    ? recipe.recipeInstructions.map((instruction: any, index: number) => ({
      id: uuidv4(),
      step: index + 1,
      content: typeof instruction === 'string' ? instruction : instruction.text || instruction.name || '',
      duration: undefined,
    }))
    : [];

  return {
    title: recipe.name || '',
    description: recipe.description || '',
    ingredients,
    instructions,
    prepTime: parseDuration(recipe.prepTime),
    cookTime: parseDuration(recipe.cookTime),
    servings: recipe.recipeYield ? parseInt(recipe.recipeYield.toString()) : undefined,
    difficulty: undefined,
    tags: Array.isArray(recipe.recipeCategory) ? recipe.recipeCategory :
      recipe.recipeCategory ? [recipe.recipeCategory] : [],
    imageUrl: recipe.image ? (Array.isArray(recipe.image) ? recipe.image[0] : recipe.image) : '',
    notes: recipe.description || '',
  };
}

function extractMicrodataRecipe($: cheerio.CheerioAPI) {
  try {
    const recipeElement = $('[itemtype*="Recipe"]').first();

    if (recipeElement.length === 0) {
      return null;
    }

    const title = recipeElement.find('[itemprop="name"]').first().text().trim();
    const description = recipeElement.find('[itemprop="description"]').first().text().trim();

    const ingredients = recipeElement.find('[itemprop="recipeIngredient"]')
      .map((i, el) => {
        const parsed = parseIngredientString($(el).text().trim());
        return {
          id: uuidv4(),
          name: parsed.name,
          amount: parsed.amount,
          unit: parsed.unit,
          displayAmount: parsed.displayAmount,
          notes: parsed.notes,
        };
      })
      .get();

    const instructions = recipeElement.find('[itemprop="recipeInstructions"]')
      .map((i, el) => ({
        id: uuidv4(),
        step: i + 1,
        content: $(el).text().trim(),
        duration: undefined,
      }))
      .get();

    return {
      title,
      description,
      ingredients,
      instructions,
      prepTime: parseDuration(recipeElement.find('[itemprop="prepTime"]').attr('datetime')),
      cookTime: parseDuration(recipeElement.find('[itemprop="cookTime"]').attr('datetime')),
      servings: parseInt(recipeElement.find('[itemprop="recipeYield"]').text()) || undefined,
      difficulty: undefined,
      tags: [],
      imageUrl: recipeElement.find('[itemprop="image"]').attr('src') || '',
      notes: description,
    };
  } catch (error) {
    console.warn('Microdata extraction failed:', error);
    return null;
  }
}

function extractBasicRecipe($: cheerio.CheerioAPI, url: string) {
  // Basic fallback scraping
  const title = $('h1').first().text().trim() ||
    $('title').text().trim() ||
    'Imported Recipe';

  const description = $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  // Try to find ingredients in common patterns
  const ingredients: any[] = [];
  $('li').each((i, el) => {
    const text = $(el).text().trim();
    if (text && (
      text.match(/\d+.*?(cup|tsp|tbsp|oz|lb|g|kg|ml|l)/i) ||
      $(el).closest('ul').prev().text().toLowerCase().includes('ingredient')
    )) {
      const parsed = parseIngredientString(text);
      ingredients.push({
        id: uuidv4(),
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit,
        notes: parsed.notes,
      });
    }
  });

  // Try to find instructions
  const instructions: any[] = [];
  $('ol li, .instructions li, .directions li').each((i, el) => {
    const text = $(el).text().trim();
    if (text) {
      instructions.push({
        id: uuidv4(),
        step: i + 1,
        content: text,
        duration: undefined,
      });
    }
  });

  const imageUrl = $('meta[property="og:image"]').attr('content') ||
    $('img').first().attr('src') ||
    '';

  return {
    title,
    description,
    ingredients: ingredients.slice(0, 20), // Limit to prevent spam
    instructions: instructions.slice(0, 20), // Limit to prevent spam
    prepTime: undefined,
    cookTime: undefined,
    servings: undefined,
    difficulty: undefined,
    tags: [],
    imageUrl,
    notes: description,
  };
}

function parseIngredientString(ingredientText: string) {
  // Clean up the ingredient text
  const cleaned = ingredientText.trim();

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

  // Patterns to match different ingredient formats:
  // 1. "2 cups flour" or "2 cup flour"
  // 2. "1/2 cup sugar" or "½ cup sugar"
  // 3. "2-3 tablespoons oil"
  // 4. "1 (14 oz) can tomatoes"
  // 5. "2 large eggs"

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

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const amountStr = match[1].trim();
      const unit = match[2] ? normalizeUnit(match[2].trim()) : '';
      const name = match[3] ? match[3].trim() : match[2]?.trim() || cleaned;

      // Parse the amount (handle fractions, ranges, etc.)
      const amount = parseAmount(amountStr);

      // Keep the original fraction format for display
      const displayAmount = formatDisplayAmount(amountStr);
      
      // Extract notes from parentheses in the name
      const { cleanName, notes } = extractNotes(name);

      return {
        name: cleanName,
        amount: amount,
        unit: unit,
        displayAmount: displayAmount,
        notes: notes,
      };
    }
  }

  // If no pattern matches, return the original text as the ingredient name
  return {
    name: cleaned,
    amount: 1,
    unit: '',
    notes: '',
  };
}

function parseAmount(amountStr: string): number {
  // Handle common fractions
  const fractionMap: { [key: string]: number } = {
    '½': 0.5, '¼': 0.25, '¾': 0.75,
    '⅓': 0.333, '⅔': 0.667,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
    '1/2': 0.5, '1/4': 0.25, '3/4': 0.75,
    '1/3': 0.333, '2/3': 0.667,
    '1/8': 0.125, '3/8': 0.375, '5/8': 0.625, '7/8': 0.875,
  };

  // Replace unicode fractions
  let cleaned = amountStr.trim();
  for (const [fraction, decimal] of Object.entries(fractionMap)) {
    cleaned = cleaned.replace(new RegExp(fraction, 'g'), decimal.toString());
  }

  // Handle ranges (e.g., "2-3", "1 to 2")
  const rangeMatch = cleaned.match(/^([\d.]+)[\s\-to]+(\d+\.?\d*)$/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return (min + max) / 2; // Return average of range
  }

  // Handle mixed numbers (e.g., "1 1/2")
  const mixedMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const numerator = parseInt(mixedMatch[2]);
    const denominator = parseInt(mixedMatch[3]);
    return whole + (numerator / denominator);
  }

  // Handle simple fractions (e.g., "3/4")
  const fractionMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1]);
    const denominator = parseInt(fractionMatch[2]);
    return numerator / denominator;
  }

  // Handle decimal numbers
  const decimalMatch = cleaned.match(/^(\d+\.?\d*)$/);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }

  // Default to 1 if we can't parse
  return 1;
}

function normalizeUnit(unit: string): string {
  const unitMap: { [key: string]: string } = {
    // Tablespoons
    'tablespoons': 'tbsp', 'tablespoon': 'tbsp', 'tbsps': 'tbsp', 'tbs': 'tbsp',

    // Teaspoons
    'teaspoons': 'tsp', 'teaspoon': 'tsp', 'tsps': 'tsp',

    // Cups
    'cups': 'cup', 'c': 'cup',

    // Fluid ounces
    'fluid ounces': 'fl oz', 'fluid ounce': 'fl oz', 'fl ozs': 'fl oz', 'fl.oz': 'fl oz',

    // Pints, quarts, gallons
    'pints': 'pint', 'pt': 'pint',
    'quarts': 'quart', 'qt': 'quart',
    'gallons': 'gallon', 'gal': 'gallon',

    // Pounds and ounces
    'pounds': 'lb', 'pound': 'lb', 'lbs': 'lb',
    'ounces': 'oz', 'ounce': 'oz', 'ozs': 'oz',

    // Metric
    'milliliters': 'ml', 'milliliter': 'ml', 'mls': 'ml',
    'liters': 'l', 'liter': 'l', 'litres': 'l', 'litre': 'l', 'ls': 'l',
    'kilograms': 'kg', 'kilogram': 'kg', 'kgs': 'kg',
    'grams': 'g', 'gram': 'g', 'gs': 'g',

    // Other
    'pinches': 'pinch', 'dashes': 'dash', 'cloves': 'clove', 'slices': 'slice',
    'pieces': 'piece', 'cans': 'can', 'packages': 'pkg', 'pkgs': 'pkg',
    'bottles': 'bottle', 'jars': 'jar', 'boxes': 'box', 'bags': 'bag',
  };

  const normalized = unit.toLowerCase().trim();
  return unitMap[normalized] || normalized;
}

function formatDisplayAmount(amountStr: string): string {
  // Clean up the amount string
  const cleaned = amountStr.trim();
  
  // Convert common text fractions to unicode fractions for better display
  const fractionMap: { [key: string]: string } = {
    '1/2': '½',
    '1/4': '¼', 
    '3/4': '¾',
    '1/3': '⅓',
    '2/3': '⅔',
    '1/8': '⅛',
    '3/8': '⅜',
    '5/8': '⅝',
    '7/8': '⅞',
  };
  
  // Handle mixed numbers (e.g., "1 1/2" -> "1½")
  const mixedMatch = cleaned.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (mixedMatch) {
    const whole = mixedMatch[1];
    const fraction = mixedMatch[2];
    const unicodeFraction = fractionMap[fraction] || fraction;
    return whole + unicodeFraction;
  }
  
  // Handle simple fractions
  const simpleFraction = fractionMap[cleaned];
  if (simpleFraction) {
    return simpleFraction;
  }
  
  // Handle ranges (keep as-is for display)
  if (cleaned.match(/^[\d.]+[\s\-to]+[\d.]+$/)) {
    return cleaned.replace(/\s*to\s*/, '-');
  }
  
  // For decimal numbers, check if they're common fractions
  const decimal = parseFloat(cleaned);
  if (!isNaN(decimal)) {
    // Convert common decimals back to fractions for display
    const decimalToFraction: { [key: number]: string } = {
      0.5: '½',
      0.25: '¼',
      0.75: '¾',
      0.333: '⅓',
      0.667: '⅔',
      0.125: '⅛',
      0.375: '⅜',
      0.625: '⅝',
      0.875: '⅞',
    };
    
    // Check for close matches (within 0.01)
    for (const [dec, frac] of Object.entries(decimalToFraction)) {
      if (Math.abs(decimal - parseFloat(dec)) < 0.01) {
        return frac;
      }
    }
    
    // For mixed numbers with decimals (e.g., 1.5 -> 1½)
    const wholePart = Math.floor(decimal);
    const fractionalPart = decimal - wholePart;
    
    if (wholePart > 0 && fractionalPart > 0) {
      const fractionDisplay = decimalToFraction[Math.round(fractionalPart * 1000) / 1000];
      if (fractionDisplay) {
        return wholePart + fractionDisplay;
      }
    }
  }
  
  // Return original if no special formatting needed
  return cleaned;
}

function extractNotes(name: string): { cleanName: string; notes: string } {
  // Extract notes from parentheses
  const parenthesesMatch = name.match(/^(.+?)\s*\(([^)]+)\)(.*)$/);
  if (parenthesesMatch) {
    const beforeParen = parenthesesMatch[1].trim();
    const insideParen = parenthesesMatch[2].trim();
    const afterParen = parenthesesMatch[3].trim();

    // If the parentheses contain size info, keep it as notes
    if (insideParen.match(/\d+\s*(oz|lb|g|kg|ml|l|inch|cm)/i) ||
      insideParen.match(/(large|medium|small|extra)/i)) {
      return {
        cleanName: (beforeParen + ' ' + afterParen).trim(),
        notes: insideParen,
      };
    }
  }

  return {
    cleanName: name,
    notes: '',
  };
}

function parseDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;

  // Parse ISO 8601 duration (PT15M = 15 minutes)
  const isoMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] || '0');
    const minutes = parseInt(isoMatch[2] || '0');
    return hours * 60 + minutes;
  }

  // Parse simple number
  const numberMatch = duration.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }

  return undefined;
}