'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Error boundary for user list page
 * Displays user-friendly error message with retry option
 */
export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('User list error:', error);
  }, [error]);

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user accounts, roles, and permissions
          </p>
        </div>

        <div className="border rounded-lg p-8 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Failed to Load Users</h2>
            <p className="text-muted-foreground max-w-md">
              We encountered an error while fetching the user list. This could be due to a
              network issue or a temporary server problem.
            </p>
            {error.message && (
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                {error.message}
              </p>
            )}
          </div>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
