import * as cheerio from 'cheerio';
import { extractJsonLdFromHtml, parseJsonLdRecipe } from './recipe-parser';
import { NewRecipeInput } from '@/types/recipe';

/**
 * Interface for scraped recipe data with metadata
 */
export interface ScrapedRecipeData {
  recipe: Partial<NewRecipeInput>;
  method: 'json-ld' | 'html-fallback' | 'microdata';
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
}

/**
 * Fetch HTML content from a URL with proper headers and error handling
 */
async function fetchHtmlContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JumpToRecipe/1.0; +https://jumptorecipe.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      throw new Error('URL does not return HTML content');
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - the website took too long to respond');
      }
      throw error;
    }
    
    throw new Error('Failed to fetch content from URL');
  }
}

/**
 * Extract recipe data using JSON-LD structured data
 */
function extractJsonLdRecipe(html: string, authorId: string): ScrapedRecipeData | null {
  try {
    const jsonLdRecipe = extractJsonLdFromHtml(html);
    
    if (!jsonLdRecipe) {
      return null;
    }

    const recipe = parseJsonLdRecipe(jsonLdRecipe, authorId);
    
    return {
      recipe,
      method: 'json-ld',
      confidence: 'high',
    };
  } catch (error) {
    console.error('Error extracting JSON-LD recipe:', error);
    return null;
  }
}

/**
 * Extract recipe data using microdata (schema.org)
 */
function extractMicrodataRecipe(html: string, authorId: string): ScrapedRecipeData | null {
  try {
    const $ = cheerio.load(html);
    
    // Look for microdata recipe
    const recipeElement = $('[itemtype*="schema.org/Recipe"]').first();
    
    if (recipeElement.length === 0) {
      return null;
    }

    const warnings: string[] = [];

    // Extract basic recipe information
    const title = recipeElement.find('[itemprop="name"]').first().text().trim() ||
                  $('h1').first().text().trim();
    
    const description = recipeElement.find('[itemprop="description"]').first().text().trim();
    
    // Extract ingredients
    const ingredients: string[] = [];
    recipeElement.find('[itemprop="recipeIngredient"]').each((_, el) => {
      const ingredient = $(el).text().trim();
      if (ingredient) {
        ingredients.push(ingredient);
      }
    });

    // Extract instructions
    const instructions: string[] = [];
    recipeElement.find('[itemprop="recipeInstructions"]').each((_, el) => {
      const instruction = $(el).text().trim();
      if (instruction) {
        instructions.push(instruction);
      }
    });

    // Extract times
    const prepTime = recipeElement.find('[itemprop="prepTime"]').attr('datetime') ||
                     recipeElement.find('[itemprop="prepTime"]').text().trim();
    
    const cookTime = recipeElement.find('[itemprop="cookTime"]').attr('datetime') ||
                     recipeElement.find('[itemprop="cookTime"]').text().trim();

    // Extract servings
    const servings = recipeElement.find('[itemprop="recipeYield"]').text().trim();

    // Extract image
    const imageUrl = recipeElement.find('[itemprop="image"]').attr('src') ||
                     recipeElement.find('[itemprop="image"]').attr('content');

    if (!title) {
      warnings.push('No recipe title found');
    }
    if (ingredients.length === 0) {
      warnings.push('No ingredients found');
    }
    if (instructions.length === 0) {
      warnings.push('No instructions found');
    }

    return {
      recipe: {
        title: title || 'Untitled Recipe',
        description,
        ingredients: ingredients.map((text, index) => ({
          id: `ingredient-${index}`,
          name: text,
          amount: 0,
          unit: '',
          position: index,
        })),
        instructions: instructions.map((text, index) => ({
          id: `instruction-${index}`,
          step: index + 1,
          content: text,
          position: index,
        })),
        prepTime: prepTime ? parseInt(prepTime) || undefined : undefined,
        cookTime: cookTime ? parseInt(cookTime) || undefined : undefined,
        servings: servings ? parseInt(servings) || undefined : undefined,
        imageUrl: imageUrl || undefined,
        tags: [],
        authorId,
        visibility: 'private',
      },
      method: 'microdata',
      confidence: ingredients.length > 0 && instructions.length > 0 ? 'medium' : 'low',
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Error extracting microdata recipe:', error);
    return null;
  }
}

/**
 * Fallback HTML parsing for recipes without structured data
 */
function extractHtmlFallbackRecipe(html: string, authorId: string): ScrapedRecipeData | null {
  try {
    const $ = cheerio.load(html);
    const warnings: string[] = [];

    // Try to find title
    let title = $('h1').first().text().trim();
    if (!title) {
      title = $('title').text().trim();
      if (title) {
        // Clean up title (remove site name, etc.)
        title = title.split('|')[0].split('-')[0].trim();
      }
    }

    // Try to find description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       $('p').first().text().trim();

    // Try to find ingredients using common patterns
    const ingredients: string[] = [];
    
    // Look for common ingredient selectors
    const ingredientSelectors = [
      '.recipe-ingredient',
      '.ingredient',
      '.ingredients li',
      '.recipe-ingredients li',
      '[class*="ingredient"] li',
      'ul:contains("cup") li',
      'ul:contains("tablespoon") li',
      'ul:contains("teaspoon") li',
    ];

    for (const selector of ingredientSelectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 2 && text.length < 200) {
          ingredients.push(text);
        }
      });
      
      if (ingredients.length > 0) break;
    }

    // Try to find instructions
    const instructions: string[] = [];
    
    const instructionSelectors = [
      '.recipe-instruction',
      '.instruction',
      '.instructions li',
      '.recipe-instructions li',
      '.directions li',
      '.recipe-directions li',
      '[class*="instruction"] li',
      '[class*="direction"] li',
      'ol li',
    ];

    for (const selector of instructionSelectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 10) {
          instructions.push(text);
        }
      });
      
      if (instructions.length > 0) break;
    }

    // Try to find image
    let imageUrl: string | undefined;
    const imageSelectors = [
      '.recipe-image img',
      '.recipe img',
      '[class*="recipe"] img',
      'meta[property="og:image"]',
    ];

    for (const selector of imageSelectors) {
      const src = $(selector).attr('src') || $(selector).attr('content');
      if (src) {
        imageUrl = src.startsWith('http') ? src : new URL(src, 'https://example.com').href;
        break;
      }
    }

    // Add warnings for missing data
    if (!title || title.length < 3) {
      warnings.push('Recipe title may be inaccurate');
    }
    if (ingredients.length === 0) {
      warnings.push('No ingredients found - manual entry required');
    }
    if (instructions.length === 0) {
      warnings.push('No instructions found - manual entry required');
    }

    // Only return data if we found at least a title
    if (!title && ingredients.length === 0 && instructions.length === 0) {
      return null;
    }

    return {
      recipe: {
        title: title || 'Imported Recipe',
        description: description || undefined,
        ingredients: ingredients.map((text, index) => ({
          id: `ingredient-${index}`,
          name: text,
          amount: 0,
          unit: '',
          position: index,
        })),
        instructions: instructions.map((text, index) => ({
          id: `instruction-${index}`,
          step: index + 1,
          content: text,
          position: index,
        })),
        imageUrl,
        tags: [],
        authorId,
        visibility: 'private',
      },
      method: 'html-fallback',
      confidence: (ingredients.length > 0 && instructions.length > 0) ? 'medium' : 'low',
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error('Error in HTML fallback parsing:', error);
    return null;
  }
}

/**
 * Main function to scrape recipe from URL
 * Tries multiple extraction methods in order of preference
 */
export async function scrapeRecipeFromUrl(url: string, authorId: string = 'temp'): Promise<ScrapedRecipeData | null> {
  try {
    // Fetch HTML content
    const html = await fetchHtmlContent(url);

    // Try extraction methods in order of preference
    
    // 1. JSON-LD (highest confidence)
    const jsonLdResult = extractJsonLdRecipe(html, authorId);
    if (jsonLdResult) {
      return jsonLdResult;
    }

    // 2. Microdata (medium confidence)
    const microdataResult = extractMicrodataRecipe(html, authorId);
    if (microdataResult && microdataResult.confidence !== 'low') {
      return microdataResult;
    }

    // 3. HTML fallback (lowest confidence)
    const fallbackResult = extractHtmlFallbackRecipe(html, authorId);
    if (fallbackResult) {
      return fallbackResult;
    }

    // If microdata had low confidence but we have no fallback, return it anyway
    if (microdataResult) {
      return microdataResult;
    }

    return null;
  } catch (error) {
    console.error('Error scraping recipe from URL:', error);
    throw error;
  }
}

/**
 * Parse recipe from HTML string (for testing or when HTML is already available)
 */
export function parseRecipeFromHtml(html: string, authorId: string): ScrapedRecipeData | null {
  // Try extraction methods in order of preference
  const jsonLdResult = extractJsonLdRecipe(html, authorId);
  if (jsonLdResult) {
    return jsonLdResult;
  }

  const microdataResult = extractMicrodataRecipe(html, authorId);
  if (microdataResult) {
    return microdataResult;
  }

  const fallbackResult = extractHtmlFallbackRecipe(html, authorId);
  if (fallbackResult) {
    return fallbackResult;
  }

  return null;
}