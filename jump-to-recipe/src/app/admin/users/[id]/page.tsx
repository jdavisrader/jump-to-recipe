import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { recipes } from '@/db/schema/recipes';
import { cookbooks } from '@/db/schema/cookbooks';
import { eq, sql } from 'drizzle-orm';
import { UserEditForm } from './user-edit-form';

/**
 * Server component for user detail/edit page
 * Fetches user data and passes to client component
 */
export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params in Next.js 15
  const { id } = await params;

  // Check authentication and authorization
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (!isAdmin(session.user.role)) {
    redirect('/admin');
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  try {
    // Fetch user with counts directly from database
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
      .where(eq(users.id, id))
      .groupBy(users.id);

    if (!userWithCounts || userWithCounts.length === 0) {
      notFound();
    }

    return (
      <div className="container mx-auto py-8 px-4">
        <UserEditForm user={userWithCounts[0]} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user details. Please try again later.');
  }
}
