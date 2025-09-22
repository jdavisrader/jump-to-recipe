'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MyRecipesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('My Recipes page error:', error);
  }, [error]);

  // Determine error type and provide appropriate messaging
  const getErrorInfo = () => {
    const message = error.message.toLowerCase();
    
    if (message.includes('authentication') || message.includes('unauthorized') || message.includes('session')) {
      return {
        title: 'Authentication Error',
        description: 'Your session has expired or you are not authorized to view this page.',
        action: 'Sign In',
        actionHref: '/auth/login?callbackUrl=/my-recipes',
        showRetry: false,
      };
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection.',
        action: 'Try Again',
        actionHref: null,
        showRetry: true,
      };
    }
    
    if (message.includes('permission') || message.includes('forbidden')) {
      return {
        title: 'Access Denied',
        description: 'You do not have permission to access your recipes at this time.',
        action: 'Go Home',
        actionHref: '/',
        showRetry: false,
      };
    }
    
    // Default error
    return {
      title: 'Something went wrong',
      description: 'An unexpected error occurred while loading your recipes.',
      action: 'Try Again',
      actionHref: null,
      showRetry: true,
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <div className="container mx-auto py-8">
      <div className="flex min-h-[400px] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-red-600">
              {errorInfo.title}
            </CardTitle>
            <CardDescription className="text-center">
              {errorInfo.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Technical Details
                </summary>
                <div className="mt-2 rounded-md bg-muted p-3 text-xs font-mono">
                  <div className="break-all">{error.message}</div>
                  {error.digest && (
                    <div className="mt-2 text-muted-foreground">
                      Error ID: {error.digest}
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-2">
            <div className="flex w-full gap-2">
              {errorInfo.showRetry && (
                <Button onClick={reset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {errorInfo.action}
                </Button>
              )}
              
              {errorInfo.actionHref && (
                <Button asChild className={errorInfo.showRetry ? 'flex-1' : 'w-full'}>
                  <Link href={errorInfo.actionHref}>
                    {errorInfo.action}
                  </Link>
                </Button>
              )}
            </div>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}