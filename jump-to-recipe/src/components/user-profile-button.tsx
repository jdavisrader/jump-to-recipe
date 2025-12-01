'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, ChefHat, Shield } from 'lucide-react';
import Image from 'next/image';

export function UserProfileButton() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMenuOpen]);
  
  if (status === 'loading') {
    return (
      <Button variant="ghost" size="icon" disabled>
        <span className="h-6 w-6 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/auth/login">Sign In</Link>
      </Button>
    );
  }
  
  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <User className="h-5 w-5" />
        )}
      </Button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-background border border-border z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Role: {session?.user?.role || 'user'}
              </p>
            </div>
            
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              <User className="mr-2 h-4 w-4" />
              Your Profile
            </Link>
            
            <Link
              href="/my-recipes"
              className="flex items-center px-4 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              <ChefHat className="mr-2 h-4 w-4" />
              My Recipes
            </Link>
            
            {session?.user?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center px-4 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                onClick={() => setIsMenuOpen(false)}
                role="menuitem"
              >
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            )}
            
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
              onClick={() => setIsMenuOpen(false)}
              role="menuitem"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
            
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-red-500 hover:bg-muted focus:bg-muted focus:outline-none"
              onClick={() => {
                setIsMenuOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              role="menuitem"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}