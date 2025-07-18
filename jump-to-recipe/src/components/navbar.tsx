'use client';

import Link from 'next/link';
import { UserProfileButton } from '@/components/user-profile-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  
  // Skip rendering navbar on auth pages
  if (pathname.startsWith('/auth/')) {
    return null;
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Jump to Recipe</span>
          </Link>
        </div>
        
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link
            href="/recipes"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.startsWith('/recipes') ? "text-primary" : "text-muted-foreground"
            )}
          >
            Recipes
          </Link>
          <Link
            href="/cookbooks"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.startsWith('/cookbooks') ? "text-primary" : "text-muted-foreground"
            )}
          >
            Cookbooks
          </Link>
          <Link
            href="/grocery-lists"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname.startsWith('/grocery-lists') ? "text-primary" : "text-muted-foreground"
            )}
          >
            Grocery Lists
          </Link>
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}