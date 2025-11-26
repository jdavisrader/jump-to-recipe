import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export type RecipePermission = 'none' | 'view' | 'edit' | 'owner';

interface UseRecipePermissionsResult {
  permission: RecipePermission;
  canView: boolean;
  canEdit: boolean;
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check user's permissions for a recipe
 * Fetches permission from the photos endpoint which includes permission info
 */
export function useRecipePermissions(recipeId: string | null): UseRecipePermissionsResult {
  const { data: session, status } = useSession();
  const [permission, setPermission] = useState<RecipePermission>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recipeId) {
      setPermission('none');
      setIsLoading(false);
      return;
    }

    // Wait for session to load
    if (status === 'loading') {
      return;
    }

    const fetchPermission = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch photos endpoint which includes permission info
        const response = await fetch(`/api/recipes/${recipeId}/photos`);

        if (response.status === 403) {
          setPermission('none');
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch recipe permissions');
        }

        const data = await response.json();
        
        if (data.permission) {
          setPermission(data.permission as RecipePermission);
        } else {
          // Fallback: if no permission in response, assume view if successful
          setPermission('view');
        }
      } catch (err) {
        console.error('Error fetching recipe permissions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
        setPermission('none');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermission();
  }, [recipeId, session, status]);

  return {
    permission,
    canView: permission !== 'none',
    canEdit: permission === 'edit' || permission === 'owner',
    isOwner: permission === 'owner',
    isLoading,
    error,
  };
}
