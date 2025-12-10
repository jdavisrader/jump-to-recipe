import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema/users';
import { recipes } from '@/db/schema/recipes';
import { cookbooks } from '@/db/schema/cookbooks';
import { eq, sql } from 'drizzle-orm';
import { UserListClient } from './user-list-client';
import type { UserWithCounts } from '@/types/admin';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  // Authorization check (defense in depth)
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/?unauthorized=1');
  }

  try {
    // Fetch users with counts using left joins and aggregations
    const usersWithCounts = await db
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
      .groupBy(users.id);

    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <AdminBreadcrumb />
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <UserListClient users={usersWithCounts as UserWithCounts[]} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users. Please try again later.');
  }
}
