import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { cookbooks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CookbookForm } from '@/components/cookbooks/cookbook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hasMinimumPermission } from '@/lib/cookbook-permissions';

export default async function EditCookbookPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Ensure params is resolved
  const resolvedParams = await Promise.resolve(params);
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/cookbooks/' + resolvedParams.id + '/edit');
  }
  
  const userId = session.user.id;
  const cookbookId = resolvedParams.id;
  
  // Get the cookbook
  const cookbook = await db.query.cookbooks.findFirst({
    where: eq(cookbooks.id, cookbookId),
  });
  
  if (!cookbook) {
    redirect('/cookbooks?error=not-found');
  }
  
  // Check if user has edit permission
  const hasEditAccess = await hasMinimumPermission(cookbookId, userId, 'edit');
  
  if (!hasEditAccess) {
    redirect('/cookbooks/' + cookbookId + '?error=forbidden');
  }

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Cookbook</CardTitle>
        </CardHeader>
        <CardContent>
          <CookbookForm cookbook={cookbook} />
        </CardContent>
      </Card>
    </div>
  );
}