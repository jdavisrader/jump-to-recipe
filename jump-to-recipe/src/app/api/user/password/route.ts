import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

// Helper function to detect if user is Google-authenticated
async function isGoogleUser(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // If user has no password, they're likely OAuth
  if (!user?.password) {
    return true;
  }

  // Check if user has Google account linked
  const googleAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.provider, 'google')
    ),
  });

  return !!googleAccount;
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

    // Check if user is Google-authenticated
    const isGoogle = await isGoogleUser(session.user.id);
    if (isGoogle) {
      return NextResponse.json(
        { error: "Password cannot be changed for Google-authenticated users" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = passwordChangeSchema.parse(body);

    // Get current user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found or no password set" },
        { status: 404 }
      );
    }

    // Verify current password
    const currentPasswordMatch = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!currentPasswordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect", field: "currentPassword" },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

    // Update password in database
    const [updatedUser] = await db
      .update(users)
      .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating password:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}