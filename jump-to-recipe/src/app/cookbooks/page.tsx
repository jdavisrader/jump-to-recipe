import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAccessibleCookbooks } from '@/lib/cookbook-permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Book, Globe, Lock, User } from 'lucide-react';
import { redirect } from 'next/navigation';
import { CookbookImage } from '@/components/cookbooks/cookbook-image';

export default async function CookbooksPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/cookbooks');
  }

  const userId = session.user.id;
  const { owned, collaborated, public: publicCookbooks } = await getUserAccessibleCookbooks(userId);

  const hasNoCookbooks = owned.length === 0 && collaborated.length === 0 && publicCookbooks.length === 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">My Cookbooks</h1>
          <p className="text-muted-foreground">
            Organize your recipes into custom cookbooks
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/cookbooks/new">
              <Plus className="h-5 w-5 mr-2" />
              Create Cookbook
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/cookbooks/discover">
              <Globe className="h-5 w-5 mr-2" />
              Discover Cookbooks
            </Link>
          </Button>
        </div>
      </div>

      {hasNoCookbooks ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have any cookbooks yet.</p>
          <Button asChild className="mt-4">
            <Link href="/cookbooks/new">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Cookbook
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Owned Cookbooks */}
          {owned.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">My Cookbooks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {owned.map((cookbook) => (
                  <Card key={cookbook.id} className="flex flex-col overflow-hidden">
                    {/* Cover Image */}
                    <div className="aspect-video relative">
                      <CookbookImage
                        src={cookbook.coverImageUrl}
                        alt={cookbook.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="line-clamp-1">{cookbook.title}</CardTitle>
                        {cookbook.isPublic ? (
                          <Globe className="h-4 w-4 text-primary" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {cookbook.description || 'No description'}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link href={`/cookbooks/${cookbook.id}`}>
                          <Book className="h-4 w-4 mr-2" />
                          View Cookbook
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Collaborated Cookbooks */}
          {collaborated.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Shared With Me</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborated.map(({ cookbook, permission }) => (
                  <Card key={cookbook.id} className="flex flex-col overflow-hidden">
                    {/* Cover Image */}
                    <div className="aspect-video relative">
                      <CookbookImage
                        src={cookbook.coverImageUrl}
                        alt={cookbook.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="line-clamp-1">{cookbook.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                            {permission === 'edit' ? 'Editor' : 'Viewer'}
                          </span>
                          {cookbook.isPublic ? (
                            <Globe className="h-4 w-4 text-primary" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {cookbook.description || 'No description'}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {cookbook.owner?.image ? (
                          <img
                            src={cookbook.owner.image}
                            alt={cookbook.owner.name || 'Owner'}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {cookbook.owner?.name || 'Unknown'}
                        </span>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/cookbooks/${cookbook.id}`}>
                          <Book className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Public Cookbooks */}
          {publicCookbooks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Public Cookbooks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicCookbooks.map((cookbook) => (
                  <Card key={cookbook.id} className="flex flex-col overflow-hidden">
                    {/* Cover Image */}
                    <div className="aspect-video relative">
                      <CookbookImage
                        src={cookbook.coverImageUrl}
                        alt={cookbook.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="line-clamp-1">{cookbook.title}</CardTitle>
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {cookbook.description || 'No description'}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {(cookbook as any).owner?.image ? (
                          <img
                            src={(cookbook as any).owner.image}
                            alt={(cookbook as any).owner.name || 'Owner'}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {(cookbook as any).owner?.name || 'Unknown'}
                        </span>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/cookbooks/${cookbook.id}`}>
                          <Book className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}