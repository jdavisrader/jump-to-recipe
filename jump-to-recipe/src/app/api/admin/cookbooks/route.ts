import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { cookbooks, cookbookCollaborators, cookbookRecipes, users } from '@/db/schema';
import { eq, sql, ilike, desc, asc, and } from 'drizzle-orm';
import { 
  validateAdminCookbooksQuery,
  createErrorResponse,
  type AdminCookbooksResponse,
  type CookbookWithMetadata 
} from '@/lib/validations/admin-cookbook';

/**
 * GET /api/admin/cookbooks
 * Fetch all cookbooks with metadata for admin management
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = validateAdminCookbooksQuery(url.searchParams);
    const { page, pageSize, search, ownerId, sortBy, sortOrder } = queryParams;

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions = [];
    if (search) {
      whereConditions.push(ilike(cookbooks.title, `%${search}%`));
    }
    if (ownerId) {
      whereConditions.push(eq(cookbooks.ownerId, ownerId));
    }

    // Build base query with joins and aggregations
    const baseQuery = db
      .select({
        id: cookbooks.id,
        title: cookbooks.title,
        description: cookbooks.description,
        coverImageUrl: cookbooks.coverImageUrl,
        isPublic: cookbooks.isPublic,
        createdAt: cookbooks.createdAt,
        updatedAt: cookbooks.updatedAt,
        ownerId: cookbooks.ownerId,
        ownerName: users.name,
        ownerEmail: users.email,
        collaboratorCount: sql<number>`cast(count(distinct ${cookbookCollaborators.userId}) as integer)`,
        recipeCount: sql<number>`cast(count(distinct ${cookbookRecipes.recipeId}) as integer)`,
      })
      .from(cookbooks)
      .leftJoin(users, eq(cookbooks.ownerId, users.id))
      .leftJoin(cookbookCollaborators, eq(cookbooks.id, cookbookCollaborators.cookbookId))
      .leftJoin(cookbookRecipes, eq(cookbooks.id, cookbookRecipes.cookbookId))
      .groupBy(
        cookbooks.id,
        cookbooks.title,
        cookbooks.description,
        cookbooks.coverImageUrl,
        cookbooks.isPublic,
        cookbooks.createdAt,
        cookbooks.updatedAt,
        cookbooks.ownerId,
        users.name,
        users.email
      );

    // Apply where conditions and sorting
    const sortColumn = sortBy === 'title' ? cookbooks.title : cookbooks.createdAt;
    const sortDirection = sortOrder === 'asc' ? asc : desc;
    
    const finalQuery = whereConditions.length > 0 
      ? baseQuery.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
      : baseQuery;

    // Execute query with pagination and sorting
    const cookbooksData = await finalQuery
      .orderBy(sortDirection(sortColumn))
      .limit(pageSize)
      .offset(offset);

    // Get total count for pagination
    const baseCountQuery = db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(cookbooks)
      .leftJoin(users, eq(cookbooks.ownerId, users.id));

    const finalCountQuery = whereConditions.length > 0 
      ? baseCountQuery.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions))
      : baseCountQuery;

    const [{ count: total }] = await finalCountQuery;

    // Transform data to match interface
    const cookbooksWithMetadata: CookbookWithMetadata[] = cookbooksData.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      coverImageUrl: row.coverImageUrl,
      isPublic: row.isPublic,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      owner: {
        id: row.ownerId || '',
        name: row.ownerName,
        email: row.ownerEmail || '',
      },
      collaboratorCount: row.collaboratorCount,
      recipeCount: row.recipeCount,
    }));

    const totalPages = Math.ceil(total / pageSize);

    const response: AdminCookbooksResponse = {
      cookbooks: cookbooksWithMetadata,
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching admin cookbooks:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(
        'Invalid query parameters',
        error.message,
        400
      );
    }
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return createErrorResponse(
      'Failed to fetch cookbooks. Please try again later.',
      errorMessage,
      500
    );
  }
}