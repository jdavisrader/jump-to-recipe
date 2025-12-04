import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for user list page
 * Shows skeleton loaders while data is being fetched
 */
export default function UsersLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Search and filter controls skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>

        {/* Table skeleton */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4">
                    <Skeleton className="h-5 w-16" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-5 w-16" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-5 w-12" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-5 w-16" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-5 w-20" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-5 w-16" />
                  </th>
                  <th className="text-left p-4">
                    <Skeleton className="h-5 w-16" />
                  </th>
                  <th className="text-right p-4">
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4">
                      <Skeleton className="h-5 w-32" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-48" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-8 mx-auto" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-8 mx-auto" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count skeleton */}
        <Skeleton className="h-5 w-40" />
      </div>
    </div>
  );
}
