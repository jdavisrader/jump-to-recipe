import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").optional(),
  image: z.string().optional(),
});

// Helper function to detect authentication provider
async function getAuthProvider(userId: string): Promise<'credentials' | 'google'> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // If user has no password, they're likely OAuth
  if (!user?.password) {
    return 'google';
  }

  // Check if user has Google account linked
  const googleAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.provider, 'google')
    ),
  });

  return googleAccount ? 'google' : 'credentials';
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile in database
    const [updatedUser] = await db
      .update(users)
      .set({
        name: validatedData.name,
        image: validatedData.image || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Get authentication provider to check restrictions
    const authProvider = await getAuthProvider(session.user.id);

    // Prevent Google users from changing email
    if (authProvider === 'google' && validatedData.email) {
      return NextResponse.json(
        { error: "Email cannot be changed for Google-authenticated users" },
        { status: 403 }
      );
    }

    // Check for email uniqueness if email is being updated
    if (validatedData.email) {
      // Check if another user has this email
      const emailTaken = await db.query.users.findFirst({
        where: eq(users.email, validatedData.email),
      });

      if (emailTaken && emailTaken.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: {
      updatedAt: Date;
      name?: string;
      email?: string;
      image?: string | null;
    } = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email;
    }

    if (validatedData.image !== undefined) {
      updateData.image = validatedData.image || null;
    }

    // Update user profile in database
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return updated user data with auth provider info (exclude password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json({
      ...userWithoutPassword,
      authProvider,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get authentication provider
    const authProvider = await getAuthProvider(session.user.id);

    // Return user data with auth provider info (exclude password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({
      ...userWithoutPassword,
      authProvider,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}