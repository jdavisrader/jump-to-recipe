import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/db';
import { cookbooks, cookbookRecipes } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { getUserAccessibleCookbooks } from '@/lib/cookbook-permissions';
import { eq, desc } from 'drizzle-orm';

// Validation schema for creating a cookbook
const createCookbookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  isPublic: z.boolean().default(false),
});

// GET /api/cookbooks - Get all cookbooks for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get all cookbooks user has access to
    const accessibleCookbooks = await getUserAccessibleCookbooks(userId);
    
    // Combine all cookbooks and add metadata
    const allCookbooks = [
      ...accessibleCookbooks.owned.map(cookbook => ({
        ...cookbook,
        userRole: 'owner' as const,
      })),
      ...accessibleCookbooks.collaborated.map(cookbook => ({
        ...cookbook,
        userRole: 'collaborator' as const,
        permission: cookbook.permission,
      })),
      ...accessibleCookbooks.public.map(cookbook => ({
        ...cookbook,
        userRole: 'viewer' as const,
      })),
    ];
    
    // Sort by updated date and apply pagination
    const sortedCookbooks = allCookbooks
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(offset, offset + limit);
    
    return NextResponse.json({ cookbooks: sortedCookbooks });
  } catch (error) {
    console.error('Error fetching cookbooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cookbooks' },
      { status: 500 }
    );
  }
}

// POST /api/cookbooks - Create a new cookbook
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    
    // Validate request body
    const validatedData = createCookbookSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const { title, description, coverImageUrl, isPublic } = validatedData.data;
    
    // Create the cookbook
    const [newCookbook] = await db
      .insert(cookbooks)
      .values({
        title,
        description,
        coverImageUrl,
        ownerId: userId,
        isPublic,
      })
      .returning();
    
    // Handle recipes if provided in the request
    if (body.recipes && Array.isArray(body.recipes)) {
      const recipeEntries = body.recipes.map((recipeId: string, index: number) => ({
        cookbookId: newCookbook.id,
        recipeId,
        position: index,
      }));
      
      if (recipeEntries.length > 0) {
        await db.insert(cookbookRecipes).values(recipeEntries);
      }
    }
    
    return NextResponse.json(
      { cookbook: newCookbook },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating cookbook:', error);
    return NextResponse.json(
      { error: 'Failed to create cookbook' },
      { status: 500 }
    );
  }
}