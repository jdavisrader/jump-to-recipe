'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('unauthorized') === '1') {
      toast({
        title: 'Not authorized',
        description: 'You do not have permission to access that page.',
        variant: 'destructive',
      });

      // Remove query parameter from URL
      router.replace(window.location.pathname);
    }
  }, [searchParams, router, toast]);

  return <>{children}</>;
}
