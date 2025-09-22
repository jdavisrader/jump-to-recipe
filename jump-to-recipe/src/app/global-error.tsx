'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary that catches errors in the root layout
 * This is a last resort error handler for critical application errors
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error occurred:', error);
    
    // In production, you might want to send this to an error tracking service
    // like Sentry, LogRocket, or Bugsnag
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-600">
                Application Error
              </CardTitle>
              <CardDescription className="text-center">
                A critical error occurred that prevented the application from loading properly.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="text-sm text-red-700">
                  We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
                </div>
              </div>
              
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
                    {error.stack && (
                      <div className="mt-2 text-muted-foreground">
                        <div className="font-semibold">Stack Trace:</div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2">
              <div className="flex w-full gap-2">
                <Button onClick={reset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                  Refresh Page
                </Button>
              </div>
              
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline" 
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}