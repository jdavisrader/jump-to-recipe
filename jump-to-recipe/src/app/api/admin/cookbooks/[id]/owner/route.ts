import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { cookbooks, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { 
  ownershipTransferSchema,
  validateCookbookId,
  createErrorResponse,
  createSuccessResponse,
  type OwnershipTransferResponse 
} from '@/lib/validations/admin-cookbook';

// PUT /api/admin/cookbooks/[id]/owner - Transfer cookbook ownership
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Resolve and validate params
    const resolvedParams = await Promise.resolve(params);
    const cookbookId = validateCookbookId(resolvedParams.id);

    // Validate session and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = ownershipTransferSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { newOwnerId } = validation.data;

    // Start database transaction for safe ownership update
    const result = await db.transaction(async (tx) => {
      // Verify cookbook exists
      const cookbook = await tx.query.cookbooks.findFirst({
        where: eq(cookbooks.id, cookbookId),
        columns: {
          id: true,
          ownerId: true,
          title: true,
        }
      });

      if (!cookbook) {
        throw new Error('Cookbook not found');
      }

      // Verify new owner exists
      const newOwner = await tx.query.users.findFirst({
        where: eq(users.id, newOwnerId),
        columns: {
          id: true,
          name: true,
          email: true,
        }
      });

      if (!newOwner) {
        throw new Error('New owner user not found');
      }

      // Check if the new owner is different from current owner
      if (cookbook.ownerId === newOwnerId) {
        throw new Error('User is already the owner of this cookbook');
      }

      // Update cookbook ownership
      await tx
        .update(cookbooks)
        .set({ 
          ownerId: newOwnerId,
          updatedAt: new Date(),
        })
        .where(eq(cookbooks.id, cookbookId));

      return {
        cookbook,
        newOwner,
      };
    });

    const response: OwnershipTransferResponse = {
      message: 'Ownership transferred successfully',
      cookbook: {
        id: result.cookbook.id,
        title: result.cookbook.title,
      },
      newOwner: {
        id: result.newOwner.id,
        name: result.newOwner.name,
        email: result.newOwner.email,
      },
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Error transferring cookbook ownership:', error);
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return createErrorResponse(
        'Invalid request data',
        error.message,
        400
      );
    }
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === 'Cookbook not found') {
        return createErrorResponse('Cookbook not found', undefined, 404);
      }
      if (error.message === 'New owner user not found') {
        return createErrorResponse('Selected user not found', undefined, 400);
      }
      if (error.message === 'User is already the owner of this cookbook') {
        return createErrorResponse('User is already the owner of this cookbook', undefined, 400);
      }
    }

    return createErrorResponse('Internal server error', undefined, 500);
  }
}