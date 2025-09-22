import { Skeleton } from '@/components/ui/skeleton';

export default function MyRecipesLoading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-9 w-48 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex flex-wrap justify-center gap-4">
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-11 w-36" />
        </div>
      </div>

      {/* Search component skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Recipe grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}