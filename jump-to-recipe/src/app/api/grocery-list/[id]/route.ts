import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { groceryLists } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GroceryListUpdateRequest, GroceryItem } from '@/types/grocery-list';

// GET /api/grocery-list/[id] - Get specific grocery list
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const groceryListId = params.id;

    // Fetch the grocery list
    const [groceryList] = await db
      .select()
      .from(groceryLists)
      .where(
        and(
          eq(groceryLists.id, groceryListId),
          eq(groceryLists.userId, session.user.id)
        )
      );

    if (!groceryList) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Grocery list not found' },
        { status: 404 }
      );
    }

    // Transform the data to match our TypeScript interface
    const formattedList = {
      id: groceryList.id,
      title: groceryList.title,
      items: groceryList.items as GroceryItem[], // Type assertion for JSONB
      userId: groceryList.userId,
      generatedFrom: groceryList.generatedFrom || [],
      createdAt: groceryList.createdAt,
      updatedAt: groceryList.updatedAt,
    };

    return NextResponse.json(formattedList);

  } catch (error) {
    console.error('Error fetching grocery list:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch grocery list' },
      { status: 500 }
    );
  }
}

// PUT /api/grocery-list/[id] - Update grocery list
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const groceryListId = params.id;
    const body: GroceryListUpdateRequest = await request.json();

    // Validate that the grocery list exists and belongs to the user
    const [existingList] = await db
      .select()
      .from(groceryLists)
      .where(
        and(
          eq(groceryLists.id, groceryListId),
          eq(groceryLists.userId, session.user.id)
        )
      );

    if (!existingList) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Grocery list not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      updatedAt: Date;
      title?: string;
      items?: GroceryItem[];
    } = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      updateData.title = body.title;
    }

    if (body.items !== undefined) {
      updateData.items = body.items;
    }

    // Update the grocery list
    const [updatedList] = await db
      .update(groceryLists)
      .set(updateData)
      .where(eq(groceryLists.id, groceryListId))
      .returning();

    // Transform the data to match our TypeScript interface
    const formattedList = {
      id: updatedList.id,
      title: updatedList.title,
      items: updatedList.items as GroceryItem[], // Type assertion for JSONB
      userId: updatedList.userId,
      generatedFrom: updatedList.generatedFrom || [],
      createdAt: updatedList.createdAt,
      updatedAt: updatedList.updatedAt,
    };

    return NextResponse.json(formattedList);

  } catch (error) {
    console.error('Error updating grocery list:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update grocery list' },
      { status: 500 }
    );
  }
}

// DELETE /api/grocery-list/[id] - Delete grocery list
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const groceryListId = params.id;

    // Validate that the grocery list exists and belongs to the user
    const [existingList] = await db
      .select()
      .from(groceryLists)
      .where(
        and(
          eq(groceryLists.id, groceryListId),
          eq(groceryLists.userId, session.user.id)
        )
      );

    if (!existingList) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Grocery list not found' },
        { status: 404 }
      );
    }

    // Delete the grocery list
    await db
      .delete(groceryLists)
      .where(eq(groceryLists.id, groceryListId));

    return NextResponse.json(
      { message: 'Grocery list deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting grocery list:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete grocery list' },
      { status: 500 }
    );
  }
}