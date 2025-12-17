import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { cookbooks, cookbookCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CookbookForm } from '@/components/cookbooks/cookbook-form';
import { AdminCollaboratorManagerStandalone } from '@/components/cookbooks/admin-collaborator-manager-standalone';
import { AdminOwnershipTransferStandalone } from '@/components/cookbooks/admin-ownership-transfer-standalone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hasMinimumPermission, hasAdminCookbookAccess } from '@/lib/cookbook-permissions';

// Note: Using standalone components that handle refresh internally

export default async function EditCookbookPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Ensure params is resolved
  const resolvedParams = await Promise.resolve(params);
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/cookbooks/' + resolvedParams.id + '/edit');
  }
  
  const userId = session.user.id;
  const userRole = session.user.role;
  const cookbookId = resolvedParams.id;
  
  // Get the cookbook with owner info
  const cookbook = await db.query.cookbooks.findFirst({
    where: eq(cookbooks.id, cookbookId),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });
  
  if (!cookbook) {
    redirect('/cookbooks?error=not-found');
  }
  
  // Check if user has edit permission (includes admin bypass)
  const hasEditAccess = await hasMinimumPermission(cookbookId, userId, 'edit', userRole);
  
  if (!hasEditAccess) {
    redirect('/cookbooks/' + cookbookId + '?error=forbidden');
  }

  const isAdmin = hasAdminCookbookAccess(userRole);

  // Get collaborators for admin view
  let collaborators: any[] = [];
  if (isAdmin) {
    collaborators = await db.query.cookbookCollaborators.findMany({
      where: eq(cookbookCollaborators.cookbookId, cookbookId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Cookbook</CardTitle>
        </CardHeader>
        <CardContent>
          <CookbookForm cookbook={cookbook} />
        </CardContent>
      </Card>

      {/* Admin-only sections */}
      {isAdmin && cookbook.owner && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Admin Management</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminCollaboratorManagerStandalone
              cookbookId={cookbookId}
              collaborators={collaborators}
            />
            
            <AdminOwnershipTransferStandalone
              cookbookId={cookbookId}
              currentOwner={{
                id: cookbook.owner.id,
                name: cookbook.owner.name,
                email: cookbook.owner.email,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}