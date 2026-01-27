/**
 * Batch Importer Module
 * 
 * Handles batch processing of recipes and users with API integration.
 * Implements retry logic with exponential backoff and error handling.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.2, 13.3, 13.4
 */

import type {
  ImportConfig,
  ImportResult,
  BatchImportResult,
} from '../types/import';
import type { TransformedRecipe, TransformedUser } from '../types/transformation';

// ============================================================================
// API Client
// ============================================================================

/**
 * API client for making authenticated requests
 */
class ApiClient {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authToken = authToken;
  }

  /**
   * Make authenticated POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }

    return response.json();
  }

  /**
   * Make authenticated GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }

    return response.json();
  }
}

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if error is retryable (5xx errors)
   */
  isRetryable(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /**
   * Check if error is a validation error (4xx errors)
   */
  isValidationError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Execute function with exponential backoff retry
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  backoffMs: number,
  shouldRetry: (error: any) => boolean = () => true
): Promise<{ result: T; retryCount: number }> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retryCount: attempt };
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!shouldRetry(error)) {
        break;
      }

      // Calculate backoff delay with exponential increase
      const delay = backoffMs * Math.pow(2, attempt);
      console.log(`  Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Batch Importer
// ============================================================================

/**
 * Batch importer for recipes and users
 */
export class BatchImporter {
  private client: ApiClient;
  private config: ImportConfig;

  constructor(config: ImportConfig) {
    this.config = config;
    this.client = new ApiClient(config.apiBaseUrl, config.authToken);
  }

  /**
   * Import recipes in batches
   */
  async importRecipes(
    recipes: TransformedRecipe[],
    onBatchComplete?: (result: BatchImportResult) => void
  ): Promise<ImportResult[]> {
    console.log(`\n📦 Importing ${recipes.length} recipes in batches of ${this.config.batchSize}...`);
    
    const batches = this.createBatches(recipes);
    const allResults: ImportResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      console.log(`\n  Batch ${batchNumber}/${batches.length} (${batch.length} recipes)...`);
      const startTime = Date.now();

      const results = await this.importRecipeBatch(batch);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`  ✓ Batch complete: ${successCount} success, ${failureCount} failed (${duration}ms)`);

      allResults.push(...results);

      // Call callback if provided
      if (onBatchComplete) {
        onBatchComplete({
          batchNumber,
          totalBatches: batches.length,
          results,
          successCount,
          failureCount,
          duration,
        });
      }

      // Add delay between batches (except for last batch)
      if (i < batches.length - 1) {
        await sleep(this.config.delayBetweenBatches);
      }

      // Stop on error if configured
      if (this.config.stopOnError && failureCount > 0) {
        console.log(`\n⚠️  Stopping import due to errors (stopOnError=true)`);
        break;
      }
    }

    return allResults;
  }

  /**
   * Import users in batches
   */
  async importUsers(
    users: TransformedUser[],
    onBatchComplete?: (result: BatchImportResult) => void
  ): Promise<ImportResult[]> {
    console.log(`\n📦 Importing ${users.length} users in batches of ${this.config.batchSize}...`);
    
    const batches = this.createBatches(users);
    const allResults: ImportResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      console.log(`\n  Batch ${batchNumber}/${batches.length} (${batch.length} users)...`);
      const startTime = Date.now();

      const results = await this.importUserBatch(batch);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`  ✓ Batch complete: ${successCount} success, ${failureCount} failed (${duration}ms)`);

      allResults.push(...results);

      // Call callback if provided
      if (onBatchComplete) {
        onBatchComplete({
          batchNumber,
          totalBatches: batches.length,
          results,
          successCount,
          failureCount,
          duration,
        });
      }

      // Add delay between batches (except for last batch)
      if (i < batches.length - 1) {
        await sleep(this.config.delayBetweenBatches);
      }

      // Stop on error if configured
      if (this.config.stopOnError && failureCount > 0) {
        console.log(`\n⚠️  Stopping import due to errors (stopOnError=true)`);
        break;
      }
    }

    return allResults;
  }

  /**
   * Import a single batch of recipes
   */
  private async importRecipeBatch(recipes: TransformedRecipe[]): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    for (const recipe of recipes) {
      const result = await this.importSingleRecipe(recipe);
      results.push(result);
    }

    return results;
  }

  /**
   * Import a single batch of users
   */
  private async importUserBatch(users: TransformedUser[]): Promise<ImportResult[]> {
    const results: ImportResult[] = [];

    for (const user of users) {
      const result = await this.importSingleUser(user);
      results.push(result);
    }

    return results;
  }

  /**
   * Import a single recipe with retry logic
   */
  private async importSingleRecipe(recipe: TransformedRecipe): Promise<ImportResult> {
    if (this.config.dryRun) {
      // Dry run mode: validate payload but don't send
      return this.dryRunRecipe(recipe);
    }

    try {
      const payload = this.prepareRecipePayload(recipe);
      console.log(`[Batch Importer] Importing recipe ${recipe.legacyId}: ${recipe.title}`);
      console.log(`[Batch Importer] Payload summary:`, {
        id: payload.id,
        title: payload.title,
        authorId: payload.authorId,
        ingredientCount: payload.ingredients?.length,
        instructionCount: payload.instructions?.length,
      });

      const { result, retryCount } = await withRetry(
        async () => {
          return await this.client.post<{ id: string; recipe?: { id: string } }>('/api/migration/recipes', payload);
        },
        this.config.maxRetries,
        this.config.retryBackoffMs,
        (error) => {
          console.error(`[Batch Importer] Error importing recipe ${recipe.legacyId}:`, error);
          // Only retry on 5xx errors or network errors
          if (error instanceof ApiError) {
            return error.isRetryable();
          }
          // Retry on network errors
          return error.name === 'TypeError' || error.message.includes('fetch');
        }
      );

      console.log(`[Batch Importer] Recipe ${recipe.legacyId} imported successfully`);

      return {
        success: true,
        legacyId: recipe.legacyId,
        newId: (result as any).id || (result as any).recipe?.id,
        retryCount,
      };
    } catch (error) {
      console.error(`[Batch Importer] Failed to import recipe ${recipe.legacyId}:`, error);
      return this.handleImportError(recipe.legacyId, error);
    }
  }

  /**
   * Import a single user with retry logic
   */
  private async importSingleUser(user: TransformedUser): Promise<ImportResult> {
    if (this.config.dryRun) {
      // Dry run mode: validate payload but don't send
      return this.dryRunUser(user);
    }

    try {
      const { result, retryCount } = await withRetry(
        async () => {
          return await this.client.post<{ id: string; user?: { id: string } }>('/api/migration/users', this.prepareUserPayload(user));
        },
        this.config.maxRetries,
        this.config.retryBackoffMs,
        (error) => {
          // Only retry on 5xx errors or network errors
          if (error instanceof ApiError) {
            return error.isRetryable();
          }
          // Retry on network errors
          return error.name === 'TypeError' || error.message.includes('fetch');
        }
      );

      return {
        success: true,
        legacyId: user.legacyId,
        newId: (result as any).id || (result as any).user?.id,
        retryCount,
      };
    } catch (error) {
      return this.handleImportError(user.legacyId, error);
    }
  }

  /**
   * Prepare recipe payload for API
   */
  private prepareRecipePayload(recipe: TransformedRecipe): any {
    // Clean up ingredients - remove migration-specific fields
    const cleanIngredients = recipe.ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      displayAmount: ing.displayAmount,
      notes: ing.notes,
      category: ing.category,
    }));

    // Clean up instructions - remove migration-specific fields
    const cleanInstructions = recipe.instructions.map(inst => ({
      id: inst.id,
      step: inst.step,
      content: inst.content,
      duration: inst.duration,
    }));

    return {
      id: recipe.id, // Include the UUID
      title: recipe.title,
      description: recipe.description,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      ingredientSections: recipe.ingredientSections,
      instructionSections: recipe.instructionSections,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      notes: recipe.notes,
      imageUrl: recipe.imageUrl,
      originalRecipePhotoUrl: (recipe as any).originalRecipePhotoUrl || null,
      sourceUrl: recipe.sourceUrl,
      authorId: recipe.authorId,
      visibility: recipe.visibility,
      commentsEnabled: recipe.commentsEnabled,
      viewCount: recipe.viewCount,
      likeCount: recipe.likeCount,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  /**
   * Prepare user payload for API
   */
  private prepareUserPayload(user: TransformedUser): any {
    return {
      id: user.id, // Include the UUID
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      password: user.password,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Dry run for recipe (validate without importing)
   */
  private dryRunRecipe(recipe: TransformedRecipe): ImportResult {
    try {
      // Basic validation
      if (!recipe.title || recipe.title.length === 0) {
        throw new Error('Title is required');
      }
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        throw new Error('At least one ingredient is required');
      }
      if (!recipe.instructions || recipe.instructions.length === 0) {
        throw new Error('At least one instruction is required');
      }
      if (!recipe.authorId) {
        throw new Error('Author ID is required');
      }

      return {
        success: true,
        legacyId: recipe.legacyId,
        newId: recipe.id, // Use the generated UUID
      };
    } catch (error) {
      return {
        success: false,
        legacyId: recipe.legacyId,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        errorType: 'validation',
      };
    }
  }

  /**
   * Dry run for user (validate without importing)
   */
  private dryRunUser(user: TransformedUser): ImportResult {
    try {
      // Basic validation
      if (!user.name || user.name.length === 0) {
        throw new Error('Name is required');
      }
      if (!user.email || user.email.length === 0) {
        throw new Error('Email is required');
      }
      if (!user.role || !['user', 'admin'].includes(user.role)) {
        throw new Error('Valid role is required');
      }

      return {
        success: true,
        legacyId: user.legacyId,
        newId: user.id, // Use the generated UUID
      };
    } catch (error) {
      return {
        success: false,
        legacyId: user.legacyId,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        errorType: 'validation',
      };
    }
  }

  /**
   * Handle import error and categorize
   */
  private handleImportError(legacyId: number, error: any): ImportResult {
    let errorType: ImportResult['errorType'] = 'unknown';
    let errorMessage = 'Unknown error';

    if (error instanceof ApiError) {
      errorMessage = error.message;
      if (error.isValidationError()) {
        errorType = 'validation';
      } else if (error.isRetryable()) {
        errorType = 'server';
      }
    } else if (error.name === 'TypeError' || error.message.includes('fetch')) {
      errorType = 'network';
      errorMessage = 'Network error: ' + error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      legacyId,
      error: errorMessage,
      errorType,
    };
  }

  /**
   * Split items into batches
   */
  private createBatches<T>(items: T[]): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += this.config.batchSize) {
      batches.push(items.slice(i, i + this.config.batchSize));
    }
    return batches;
  }
}

// ============================================================================
// Exports
// ============================================================================

export { ApiError, withRetry };
