import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { recipes } from '@/db/schema/recipes';
import { cookbooks } from '@/db/schema/cookbooks';
import { cookbookCollaborators } from '@/db/schema/cookbooks';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { UserDetailResponse, UserUpdateResponse, UserDeleteResponse } from '@/types/admin';
import { userEditSchema, userDeleteSchema } from '@/types/admin';

/**
 * GET /api/admin/users/[id]
 * Fetch single user details with counts
 * Requires admin role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

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

    const userId = id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Fetch user with counts
    const userWithCounts = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        password: users.password,
        image: users.image,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        recipeCount: sql<number>`cast(count(distinct ${recipes.id}) as integer)`,
        cookbookCount: sql<number>`cast(count(distinct ${cookbooks.id}) as integer)`,
      })
      .from(users)
      .leftJoin(recipes, eq(recipes.authorId, users.id))
      .leftJoin(cookbooks, eq(cookbooks.ownerId, users.id))
      .where(eq(users.id, userId))
      .groupBy(users.id);

    if (!userWithCounts || userWithCounts.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const response: UserDetailResponse = {
      user: userWithCounts[0],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error fetching user:', error);
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user details. Please try again later.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user profile and role
 * Requires admin role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

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

    const userId = id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body. Please provide valid JSON.' },
        { status: 400 }
      );
    }

    const validation = userEditSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return NextResponse.json(
        { 
          error: 'Validation failed. Please check your input.',
          details: errors 
        },
        { status: 400 }
      );
    }

    const { name, email, role, password } = validation.data;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check email uniqueness (excluding current user)
    if (email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      name: string;
      email: string;
      role: string;
      password?: string;
      updatedAt: Date;
    } = {
      name,
      email,
      role,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (password) {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      } catch (hashError) {
        console.error('[API] Error hashing password:', hashError);
        return NextResponse.json(
          { error: 'Failed to process password. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Update user
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // Fetch updated user with counts
    const updatedUserWithCounts = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        password: users.password,
        image: users.image,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        recipeCount: sql<number>`cast(count(distinct ${recipes.id}) as integer)`,
        cookbookCount: sql<number>`cast(count(distinct ${cookbooks.id}) as integer)`,
      })
      .from(users)
      .leftJoin(recipes, eq(recipes.authorId, users.id))
      .leftJoin(cookbooks, eq(cookbooks.ownerId, users.id))
      .where(eq(users.id, userId))
      .groupBy(users.id);

    const response: UserUpdateResponse = {
      success: true,
      user: updatedUserWithCounts[0],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error updating user:', error);
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check for specific database errors
    if (errorMessage.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Email address is already in use by another account.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update user. Please try again later.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user and transfer ownership of their content
 * Requires admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

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

    const userId = id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body. Please provide valid JSON.' },
        { status: 400 }
      );
    }

    const validation = userDeleteSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return NextResponse.json(
        { 
          error: 'Validation failed. Please provide a valid new owner ID.',
          details: errors 
        },
        { status: 400 }
      );
    }

    const { newOwnerId } = validation.data;

    // Check if user exists
    const userToDelete = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if new owner exists and is not the user being deleted
    if (newOwnerId === userId) {
      return NextResponse.json(
        { error: 'Cannot transfer ownership to the user being deleted' },
        { status: 400 }
      );
    }

    const newOwner = await db.query.users.findFirst({
      where: eq(users.id, newOwnerId),
    });

    if (!newOwner) {
      return NextResponse.json(
        { error: 'New owner not found' },
        { status: 404 }
      );
    }

    // Check if user being deleted is the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = await db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(users)
        .where(eq(users.role, 'admin'));

      if (adminCount[0].count <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    // Execute deletion with ownership transfer in a transaction
    try {
      await db.transaction(async (tx) => {
        // Transfer recipe ownership
        await tx
          .update(recipes)
          .set({ authorId: newOwnerId, updatedAt: new Date() })
          .where(eq(recipes.authorId, userId));

        // Transfer cookbook ownership
        await tx
          .update(cookbooks)
          .set({ ownerId: newOwnerId, updatedAt: new Date() })
          .where(eq(cookbooks.ownerId, userId));

        // Remove user from cookbook collaborator lists
        await tx
          .delete(cookbookCollaborators)
          .where(eq(cookbookCollaborators.userId, userId));

        // Delete user account
        await tx
          .delete(users)
          .where(eq(users.id, userId));
      });
    } catch (txError) {
      console.error('[API] Transaction error during user deletion:', txError);
      const txErrorMessage = txError instanceof Error ? txError.message : 'Unknown error';
      return NextResponse.json(
        { 
          error: 'Failed to delete user. All changes have been rolled back.',
          details: txErrorMessage 
        },
        { status: 500 }
      );
    }

    const response: UserDeleteResponse = {
      success: true,
      message: `User ${userToDelete.name} deleted successfully. Content transferred to ${newOwner.name}.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Error deleting user:', error);
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check for specific database errors
    if (errorMessage.includes('foreign key constraint')) {
      return NextResponse.json(
        { 
          error: 'Failed to delete user due to data dependencies. Please contact support.',
          details: errorMessage 
        },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('transaction')) {
      return NextResponse.json(
        { 
          error: 'Failed to complete user deletion. The operation has been rolled back.',
          details: errorMessage 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user. Please try again later.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
