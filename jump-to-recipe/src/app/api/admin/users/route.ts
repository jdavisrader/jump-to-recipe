import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { recipes } from '@/db/schema/recipes';
import { cookbooks } from '@/db/schema/cookbooks';
import { eq, sql } from 'drizzle-orm';
import type { UsersListResponse } from '@/types/admin';

/**
 * GET /api/admin/users
 * Fetch all users with recipe and cookbook counts
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

    // Fetch users with counts using left joins and aggregations
    const usersWithCounts = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        password: users.password,
        image: users.image,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        recipeCount: sql<number>`cast(count(distinct ${recipes.id}) as integer)`,
        cookbookCount: sql<number>`cast(count(distinct ${cookbooks.id}) as integer)`,
      })
      .from(users)
      .leftJoin(recipes, eq(recipes.authorId, users.id))
      .leftJoin(cookbooks, eq(cookbooks.ownerId, users.id))
      .groupBy(users.id);

    const response: UsersListResponse = {
      users: usersWithCounts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch users. Please try again later.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
