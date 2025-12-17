import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { CookbookListClient } from './cookbook-list-client';

export default async function AdminCookbooksPage() {
  const session = await getServerSession(authOptions);
  
  // Authorization check (defense in depth)
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/?unauthorized=1');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <AdminBreadcrumb />
        <div>
          <h1 className="text-3xl font-bold">Cookbook Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage cookbooks, ownership, and collaborators across the platform
          </p>
        </div>
        <CookbookListClient />
      </div>
    </div>
  );
}