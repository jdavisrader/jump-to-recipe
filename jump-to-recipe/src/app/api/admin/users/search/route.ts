import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { or, ilike } from 'drizzle-orm';

// GET /api/admin/users/search - Search users by name or email
export async function GET(request: NextRequest) {
  try {
    // Validate session and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    const searchTerm = `%${query.trim()}%`;

    // Search users by name or email
    const searchResults = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(
        or(
          ilike(users.name, searchTerm),
          ilike(users.email, searchTerm)
        )
      )
      .limit(10) // Limit results to prevent overwhelming UI
      .orderBy(users.name);

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}