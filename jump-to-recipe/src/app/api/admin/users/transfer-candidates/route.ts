import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { ne } from 'drizzle-orm';
import type { TransferCandidatesResponse } from '@/types/admin';

/**
 * GET /api/admin/users/transfer-candidates
 * Fetch users who can receive transferred content
 * Excludes the user being deleted
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

    // Get excludeUserId from query parameters
    const { searchParams } = new URL(request.url);
    const excludeUserId = searchParams.get('excludeUserId');

    // Validate UUID format if provided
    if (excludeUserId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(excludeUserId)) {
        return NextResponse.json(
          { error: 'Invalid user ID format' },
          { status: 400 }
        );
      }
    }

    // Fetch users excluding the specified user
    let transferCandidates;
    
    if (excludeUserId) {
      transferCandidates = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(ne(users.id, excludeUserId))
        .orderBy(users.name);
    } else {
      transferCandidates = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .orderBy(users.name);
    }

    const response: TransferCandidatesResponse = {
      users: transferCandidates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching transfer candidates:', error);
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch available users. Please try again later.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
