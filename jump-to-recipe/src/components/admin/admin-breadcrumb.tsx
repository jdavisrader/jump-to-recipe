'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  
  // Generate breadcrumb items based on pathname
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Admin', href: '/admin' }
    ];
    
    if (paths.length > 1) {
      const section = paths[1];
      
      // Map section names to readable labels
      const sectionLabels: Record<string, string> = {
        'users': 'User Management',
        'recipes': 'Recipe Management',
        'cookbooks': 'Cookbook Management',
      };
      
      if (sectionLabels[section]) {
        breadcrumbs.push({
          label: sectionLabels[section],
          href: `/admin/${section}`
        });
      }
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  // Don't show breadcrumbs on the main admin page
  if (pathname === '/admin') {
    return null;
  }
  
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        <li>
          <Link 
            href="/admin" 
            className="flex items-center hover:text-primary transition-colors"
            aria-label="Admin Dashboard"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4" />
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="hover:text-primary transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
