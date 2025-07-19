import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { scrapeRecipeFromUrl } from '@/lib/recipe-scraper';
import { normalizeRecipeData } from '@/lib/recipe-normalizer';
import { createRecipeSchema } from '@/lib/validations/recipe';

// Validation schema for import request
const importRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  preview: z.boolean().default(true), // Whether to return preview or save directly
});

/**
 * POST /api/recipes/import
 * 
 * Imports a recipe from a URL
 * Supports both JSON-LD structured data and HTML parsing fallback
 * Can return preview data or save directly based on preview parameter
 */
export async function POST(req: NextRequest) {
  try {
    // Get current user from session
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate request data
    const validationResult = importRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { url, preview } = validationResult.data;

    try {
      // Step 1: Scrape the recipe from URL
      const scrapedData = await scrapeRecipeFromUrl(url);

      if (!scrapedData) {
        return NextResponse.json(
          { 
            error: 'Could not extract recipe data from the provided URL',
            details: 'The page may not contain structured recipe data or may not be accessible'
          },
          { status: 422 }
        );
      }

      // Step 2: Normalize and clean the data
      const normalizedRecipe = normalizeRecipeData(scrapedData, session.user.id);

      // Step 3: Add source URL
      normalizedRecipe.sourceUrl = url;

      // Step 4: Validate the normalized recipe data
      const recipeValidation = createRecipeSchema.safeParse(normalizedRecipe);

      if (!recipeValidation.success) {
        return NextResponse.json(
          {
            error: 'Imported recipe data is invalid',
            details: recipeValidation.error.issues,
            rawData: scrapedData // Include raw data for debugging
          },
          { status: 422 }
        );
      }

      // Step 5: Return preview or save based on request
      if (preview) {
        // Return preview data for user review
        return NextResponse.json({
          success: true,
          preview: true,
          recipe: recipeValidation.data,
          metadata: {
            sourceUrl: url,
            scrapingMethod: scrapedData.method || 'unknown',
            extractedAt: new Date().toISOString(),
          }
        });
      } else {
        // Save the recipe directly (this would be called after user approves preview)
        const { db } = await import('@/db');
        const { recipes } = await import('@/db/schema/recipes');

        const newRecipe = await db.insert(recipes).values({
          ...recipeValidation.data,
          authorId: session.user.id,
        }).returning();

        return NextResponse.json({
          success: true,
          preview: false,
          recipe: newRecipe[0],
          metadata: {
            sourceUrl: url,
            scrapingMethod: scrapedData.method || 'unknown',
            savedAt: new Date().toISOString(),
          }
        }, { status: 201 });
      }

    } catch (scrapingError) {
      console.error('Error scraping recipe:', scrapingError);
      
      // Provide more specific error messages based on the error type
      if (scrapingError instanceof Error) {
        if (scrapingError.message.includes('fetch')) {
          return NextResponse.json(
            { 
              error: 'Could not access the provided URL',
              details: 'The website may be down, require authentication, or block automated access'
            },
            { status: 422 }
          );
        }
        
        if (scrapingError.message.includes('timeout')) {
          return NextResponse.json(
            { 
              error: 'Request timed out',
              details: 'The website took too long to respond'
            },
            { status: 408 }
          );
        }
      }

      return NextResponse.json(
        { 
          error: 'Failed to import recipe from URL',
          details: scrapingError instanceof Error ? scrapingError.message : 'Unknown error occurred'
        },
        { status: 422 }
      );
    }

  } catch (error) {
    console.error('Error in recipe import:', error);
    return NextResponse.json(
      { error: 'Internal server error during recipe import' },
      { status: 500 }
    );
  }
}