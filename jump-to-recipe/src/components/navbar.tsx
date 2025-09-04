'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserProfileButton } from '@/components/user-profile-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Skip rendering navbar on auth pages
  if (pathname.startsWith('/auth/')) {
    return null;
  }
  
  const navLinks = [
    { href: '/recipes', label: 'Recipes' },
    { href: '/cookbooks', label: 'Cookbooks' },
    { href: '/grocery-lists', label: 'Grocery Lists' },
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Jump to Recipe</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="ml-auto flex items-center space-x-2">
          {/* Recipe Action Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/recipes/new">
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/recipes/import">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Link>
            </Button>
          </div>
          
          <ThemeToggle />
          <UserProfileButton />
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col space-y-4 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary p-2",
                  pathname.startsWith(link.href) ? "text-primary bg-muted rounded-md" : "text-muted-foreground"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Recipe Action Buttons - Mobile */}
            <div className="border-t pt-4 space-y-2">
              <Button asChild size="sm" className="w-full justify-start">
                <Link href="/recipes/new" onClick={() => setIsMenuOpen(false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recipe
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="w-full justify-start">
                <Link href="/recipes/import" onClick={() => setIsMenuOpen(false)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Recipe
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}