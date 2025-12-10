import { Skeleton } from '@/components/ui/skeleton';

export default function RecipesLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="space-y-4">
          {/* Search and Filter Controls Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-[200px]" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
          </div>

          {/* Table Skeleton */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header */}
                <div className="bg-muted/50 p-4 flex gap-4">
                  <Skeleton className="h-6 flex-1" />
                  <Skeleton className="h-6 w-32 hidden sm:block" />
                  <Skeleton className="h-6 w-32 hidden md:block" />
                  <Skeleton className="h-6 w-32 hidden lg:block" />
                  <Skeleton className="h-6 w-24" />
                </div>
                {/* Rows */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="border-t p-4 flex gap-4">
                    <Skeleton className="h-6 flex-1" />
                    <Skeleton className="h-6 w-32 hidden sm:block" />
                    <Skeleton className="h-6 w-32 hidden md:block" />
                    <Skeleton className="h-6 w-32 hidden lg:block" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results count skeleton */}
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
    </div>
  );
}
