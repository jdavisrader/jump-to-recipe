import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/db';
import { cookbooks, cookbookCollaborators, users } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// Validation schema for sharing a cookbook
const shareCookbookSchema = z.object({
  userEmail: z.string().email('Valid email is required'),
  permission: z.enum(['view', 'edit']).default('view'),
});

// POST /api/cookbooks/[id]/share - Share a cookbook with another user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id: cookbookId } = await params;
    
    // Get the cookbook and verify ownership
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });
    
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }
    
    // Only the owner can share a cookbook
    if (cookbook.ownerId !== userId) {
      return NextResponse.json({ error: 'Only the cookbook owner can share it' }, { status: 403 });
    }
    
    const body = await req.json();
    const validatedData = shareCookbookSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.issues },
        { status: 400 }
      );
    }
    
    const { userEmail, permission } = validatedData.data;
    
    // Find the user to share with
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, userEmail),
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user is trying to share with themselves
    if (targetUser.id === userId) {
      return NextResponse.json({ error: 'Cannot share cookbook with yourself' }, { status: 400 });
    }
    
    // Check if user is already a collaborator
    const existingCollaborator = await db.query.cookbookCollaborators.findFirst({
      where: and(
        eq(cookbookCollaborators.cookbookId, cookbookId),
        eq(cookbookCollaborators.userId, targetUser.id)
      ),
    });
    
    if (existingCollaborator) {
      // Update existing collaborator's permission
      const [updatedCollaborator] = await db
        .update(cookbookCollaborators)
        .set({
          permission,
          updatedAt: new Date(),
        })
        .where(eq(cookbookCollaborators.id, existingCollaborator.id))
        .returning();
      
      return NextResponse.json({
        message: 'Collaborator permission updated successfully',
        collaborator: {
          ...updatedCollaborator,
          user: {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            image: targetUser.image,
          },
        },
      });
    }
    
    // Create new collaborator
    const [newCollaborator] = await db
      .insert(cookbookCollaborators)
      .values({
        cookbookId,
        userId: targetUser.id,
        permission,
      })
      .returning();
    
    return NextResponse.json({
      message: 'Cookbook shared successfully',
      collaborator: {
        ...newCollaborator,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          image: targetUser.image,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error sharing cookbook:', error);
    return NextResponse.json(
      { error: 'Failed to share cookbook' },
      { status: 500 }
    );
  }
}

// GET /api/cookbooks/[id]/share - Get collaborators for a cookbook
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id: cookbookId } = await params;
    
    // Get the cookbook and verify access
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });
    
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }
    
    // Check if user has access to view collaborators (owner or collaborator)
    const hasAccess = cookbook.ownerId === userId || 
      await db.query.cookbookCollaborators.findFirst({
        where: and(
          eq(cookbookCollaborators.cookbookId, cookbookId),
          eq(cookbookCollaborators.userId, userId)
        ),
      });
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get all collaborators with user information
    const collaborators = await db.query.cookbookCollaborators.findMany({
      where: eq(cookbookCollaborators.cookbookId, cookbookId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
    
    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaborators' },
      { status: 500 }
    );
  }
}

// DELETE /api/cookbooks/[id]/share - Remove a collaborator
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id: cookbookId } = await params;
    const url = new URL(req.url);
    const collaboratorUserId = url.searchParams.get('userId');
    
    if (!collaboratorUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the cookbook and verify ownership
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });
    
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }
    
    // Only the owner can remove collaborators
    if (cookbook.ownerId !== userId) {
      return NextResponse.json({ error: 'Only the cookbook owner can remove collaborators' }, { status: 403 });
    }
    
    // Remove the collaborator
    await db
      .delete(cookbookCollaborators)
      .where(and(
        eq(cookbookCollaborators.cookbookId, cookbookId),
        eq(cookbookCollaborators.userId, collaboratorUserId)
      ));
    
    return NextResponse.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json(
      { error: 'Failed to remove collaborator' },
      { status: 500 }
    );
  }
}