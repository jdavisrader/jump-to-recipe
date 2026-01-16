import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { cookbookCollaborators, users, cookbooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  addCollaboratorSchema,
  validateCookbookId,
  createErrorResponse,
  createSuccessResponse,
  type AddCollaboratorResponse 
} from '@/lib/validations/admin-cookbook';

// POST /api/admin/cookbooks/[id]/collaborators - Add collaborator
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Validate session and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return createErrorResponse('Admin access required', undefined, 401);
    }

    // Resolve and validate params
    const resolvedParams = await Promise.resolve(params);
    const cookbookId = validateCookbookId(resolvedParams.id);

    // Parse and validate request body
    const body = await request.json();
    const validationResult = addCollaboratorSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse(
        'Invalid request data',
        validationResult.error.issues,
        400
      );
    }

    const { userId, permission } = validationResult.data;

    // Verify cookbook exists
    const cookbook = await db
      .select({ id: cookbooks.id, ownerId: cookbooks.ownerId })
      .from(cookbooks)
      .where(eq(cookbooks.id, cookbookId))
      .limit(1);

    if (cookbook.length === 0) {
      return createErrorResponse('Cookbook not found', undefined, 404);
    }

    // Verify user exists
    const user = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return createErrorResponse('User not found', undefined, 404);
    }

    // Check if user is already a collaborator
    const existingCollaborator = await db
      .select({ id: cookbookCollaborators.id })
      .from(cookbookCollaborators)
      .where(
        and(
          eq(cookbookCollaborators.cookbookId, cookbookId),
          eq(cookbookCollaborators.userId, userId)
        )
      )
      .limit(1);

    if (existingCollaborator.length > 0) {
      return createErrorResponse('User is already a collaborator on this cookbook', undefined, 409);
    }

    // Check if user is the owner
    if (cookbook[0].ownerId === userId) {
      return createErrorResponse('Cannot add cookbook owner as collaborator', undefined, 400);
    }

    // Add collaborator
    const newCollaborator = await db
      .insert(cookbookCollaborators)
      .values({
        cookbookId,
        userId,
        permission,
        invitedAt: new Date(),
      })
      .returning();

    const response: AddCollaboratorResponse = {
      success: true,
      collaborator: {
        ...newCollaborator[0],
        permission: newCollaborator[0].permission as 'view' | 'edit',
      },
      message: `Successfully added ${user[0].name} as a collaborator`
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Error adding collaborator:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(
        'Invalid request data',
        error.message,
        400
      );
    }
    
    return createErrorResponse('Internal server error', undefined, 500);
  }
}

