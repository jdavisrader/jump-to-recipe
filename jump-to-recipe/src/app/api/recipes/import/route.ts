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

    // Create a mock recipe object that matches our Recipe type
    const recipe: Recipe = {
      id: uuidv4(),
      title: recipeData.title || 'Imported Recipe',
      description: recipeData.description || '',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
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
    ? recipe.recipeIngredient.map((ingredient: string, index: number) => ({
        id: uuidv4(),
        name: ingredient,
        amount: 0,
        unit: '',
        notes: '',
      }))
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
      .map((i, el) => ({
        id: uuidv4(),
        name: $(el).text().trim(),
        amount: 0,
        unit: '',
        notes: '',
      }))
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
      imageUrl: recipeElement.find('[itemprop="image"]').attr('src') || '',
      tags: [],
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
      ingredients.push({
        id: uuidv4(),
        name: text,
        amount: 0,
        unit: '',
        notes: '',
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
    imageUrl,
    tags: [],
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