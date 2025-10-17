import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, accounts } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileLayout } from "@/components/profile/profile-layout";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { ProfilePageWrapper } from "@/components/profile/profile-page-wrapper";

export const metadata: Metadata = {
  title: "Profile | Jump to Recipe",
  description: "Manage your account settings, update your profile information, and change your password.",
  robots: {
    index: false, // Profile pages should not be indexed by search engines
    follow: false,
  },
};

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

export default async function ProfilePage() {
  // Get the current session
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Fetch user profile data from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  // Handle case where user is not found (shouldn't happen but good to be safe)
  if (!user) {
    redirect('/auth/login');
  }

  // Get authentication provider
  const authProvider = await getAuthProvider(session.user.id);

  // Prepare user data for the client component (exclude password)
  const profileData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    authProvider,
  };

  return (
    <ProfilePageWrapper>
      <ProfileLayout
        sidebar={<ProfileSidebar user={profileData} />}
      >
        <ProfileForm initialData={profileData} />
      </ProfileLayout>
    </ProfilePageWrapper>
  );
}