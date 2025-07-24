import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CookbookForm } from '@/components/cookbooks/cookbook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewCookbookPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/cookbooks/new');
  }

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Cookbook</CardTitle>
        </CardHeader>
        <CardContent>
          <CookbookForm />
        </CardContent>
      </Card>
    </div>
  );
}