import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { cookbooks } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq, desc, and, not, count } from 'drizzle-orm';

// GET /api/cookbooks/discover - Discover public cookbooks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get public cookbooks, excluding those owned by the current user
    const publicCookbooks = await db.query.cookbooks.findMany({
      where: and(
        eq(cookbooks.isPublic, true),
        not(eq(cookbooks.ownerId, userId))
      ),
      with: {
        owner: {
          columns: {
            id: true,
            name: true,
            image: true,
          }
        }
      },
      orderBy: [desc(cookbooks.createdAt)],
      limit,
      offset,
    });
    
    // Count total public cookbooks for pagination
    const [{ count: totalCount }] = await db
      .select({ count: count() })
      .from(cookbooks)
      .where(and(
        eq(cookbooks.isPublic, true),
        not(eq(cookbooks.ownerId, userId))
      ));
    
    return NextResponse.json({
      cookbooks: publicCookbooks,
      pagination: {
        total: Number(totalCount),
        limit,
        offset,
      }
    });
  } catch (error) {
    console.error('Error discovering cookbooks:', error);
    return NextResponse.json(
      { error: 'Failed to discover cookbooks' },
      { status: 500 }
    );
  }
}