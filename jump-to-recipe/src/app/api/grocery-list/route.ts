import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { groceryLists } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { GroceryItem } from '@/types/grocery-list';

// GET /api/grocery-list - List user's grocery lists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Fetch user's grocery lists
    const userGroceryLists = await db
      .select()
      .from(groceryLists)
      .where(eq(groceryLists.userId, session.user.id))
      .orderBy(desc(groceryLists.updatedAt))
      .limit(limit)
      .offset(offset);

    // Transform the data to match our TypeScript interface
    const formattedLists = userGroceryLists.map(list => ({
      id: list.id,
      title: list.title,
      items: list.items as GroceryItem[], // Type assertion for JSONB
      userId: list.userId,
      generatedFrom: list.generatedFrom || [],
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    }));

    return NextResponse.json({
      groceryLists: formattedLists,
      pagination: {
        page,
        limit,
        hasMore: userGroceryLists.length === limit,
      },
    });

  } catch (error) {
    console.error('Error fetching grocery lists:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch grocery lists' },
      { status: 500 }
    );
  }
}