import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { cookbooks } from '@/db/schema';
import { eq, and, not, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Book, User } from 'lucide-react';

async function DiscoverCookbooks() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <p>Please sign in to discover cookbooks</p>
      </div>
    );
  }
  
  const userId = session.user.id;
  
  // Get public cookbooks, excluding those owned by the current user
  const publicCookbooks = await db.query.cookbooks.findMany({
    where: and(
      eq(cookbooks.isPublic, true),
      not(eq(cookbooks.ownerId, userId))
    ),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          image: true,
        }
      }
    },
    orderBy: [desc(cookbooks.createdAt)],
    limit: 20,
  });

  if (publicCookbooks.length === 0) {
    return (
      <div className="text-center py-12 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="p-6 rounded-full bg-muted">
            <Globe className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">No public cookbooks yet</h2>
          <p className="text-muted-foreground max-w-md">
            There are no public cookbooks available to discover at the moment. 
            Be the first to share your cookbook with the community!
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/cookbooks/new">
              Create a Cookbook
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/cookbooks">
              My Cookbooks
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {publicCookbooks.map((cookbook) => (
        <Card key={cookbook.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="line-clamp-1">{cookbook.title}</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
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
                <Image
                  src={cookbook.owner.image}
                  alt={cookbook.owner.name || 'User'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {cookbook.owner?.name || 'Unknown User'}
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
  );
}

export default function DiscoverPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Discover Cookbooks</h1>
          <p className="text-muted-foreground">
            Explore public cookbooks shared by the community
          </p>
        </div>
      </div>
      
      <Suspense fallback={<div className="text-center py-12">Loading cookbooks...</div>}>
        <DiscoverCookbooks />
      </Suspense>
    </div>
  );
}