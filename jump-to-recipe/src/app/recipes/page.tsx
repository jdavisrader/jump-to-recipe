import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import RecipesClient from './RecipesClient';

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <RecipesClient />
    </Suspense>
  );
}
