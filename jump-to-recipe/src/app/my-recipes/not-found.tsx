import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MyRecipesNotFound() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <FileQuestion className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-center">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </CardDescription>
          </CardHeader>
          
          <CardFooter className="flex flex-col gap-2">
            <div className="flex w-full gap-2">
              <Button asChild className="flex-1">
                <Link href="/my-recipes">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  My Recipes
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}