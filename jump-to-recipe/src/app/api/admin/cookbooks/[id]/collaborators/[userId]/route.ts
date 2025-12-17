import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { cookbookCollaborators, cookbooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { 
  validateCookbookId,
  validateUserId,
  createErrorResponse,
  createSuccessResponse,
  type RemoveCollaboratorResponse 
} from '@/lib/validations/admin-cookbook';

// DELETE /api/admin/cookbooks/[id]/collaborators/[userId] - Remove collaborator
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> | { id: string; userId: string } }
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
    const userId = validateUserId(resolvedParams.userId);

    // Verify cookbook exists
    const cookbook = await db
      .select({ id: cookbooks.id })
      .from(cookbooks)
      .where(eq(cookbooks.id, cookbookId))
      .limit(1);

    if (cookbook.length === 0) {
      return createErrorResponse('Cookbook not found', undefined, 404);
    }

    // Verify collaborator exists
    const collaborator = await db
      .select({ id: cookbookCollaborators.id })
      .from(cookbookCollaborators)
      .where(
        and(
          eq(cookbookCollaborators.cookbookId, cookbookId),
          eq(cookbookCollaborators.userId, userId)
        )
      )
      .limit(1);

    if (collaborator.length === 0) {
      return createErrorResponse('Collaborator not found', undefined, 404);
    }

    // Remove collaborator
    await db
      .delete(cookbookCollaborators)
      .where(
        and(
          eq(cookbookCollaborators.cookbookId, cookbookId),
          eq(cookbookCollaborators.userId, userId)
        )
      );

    const response: RemoveCollaboratorResponse = {
      success: true,
      message: 'Collaborator removed successfully'
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Error removing collaborator:', error);
    
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