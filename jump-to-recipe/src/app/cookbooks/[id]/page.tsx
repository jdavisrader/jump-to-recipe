import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { cookbooks, cookbookRecipes, cookbookCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CookbookDisplay } from '@/components/cookbooks/cookbook-display';
import { getCookbookPermission } from '@/lib/cookbook-permissions';

export default async function CookbookPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Ensure params is resolved
  const resolvedParams = await Promise.resolve(params);
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/cookbooks/' + resolvedParams.id);
  }
  
  const userId = session.user.id;
  const cookbookId = resolvedParams.id;
  
  // Get the cookbook with owner info
  const cookbook = await db.query.cookbooks.findFirst({
    where: eq(cookbooks.id, cookbookId),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          image: true,
        }
      }
    }
  });
  
  if (!cookbook) {
    redirect('/cookbooks?error=not-found');
  }
  
  // Check user permission
  const permission = await getCookbookPermission(cookbookId, userId);
  
  if (permission === 'none') {
    redirect('/cookbooks?error=forbidden');
  }
  
  // Get cookbook recipes with their positions
  const cookbookRecipeEntries = await db.query.cookbookRecipes.findMany({
    where: eq(cookbookRecipes.cookbookId, cookbookId),
    with: {
      recipe: true
    }
  });
  
  // Get collaborators
  const collaborators = await db.query.cookbookCollaborators.findMany({
    where: eq(cookbookCollaborators.cookbookId, cookbookId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        }
      }
    }
  });
  
  // Prepare full cookbook data
  const cookbookFull = {
    ...cookbook,
    recipes: cookbookRecipeEntries.map(entry => ({
      recipe: entry.recipe,
      position: entry.position,
    })),
    collaborators,
  };
  
  const isOwner = cookbook.ownerId === userId;
  const canEdit = permission === 'owner' || permission === 'edit';

  return (
    <div className="container mx-auto py-8">
      <CookbookDisplay 
        cookbook={cookbookFull}
        isOwner={isOwner}
        canEdit={canEdit}
      />
    </div>
  );
}