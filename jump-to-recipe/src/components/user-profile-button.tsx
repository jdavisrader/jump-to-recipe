'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';
import Image from 'next/image';

export function UserProfileButton() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
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
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Role: {session?.user?.role || 'user'}
              </p>
            </div>
            
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="mr-2 h-4 w-4" />
              Your Profile
            </Link>
            
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm hover:bg-muted"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
            
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-red-500 hover:bg-muted"
              onClick={() => {
                setIsMenuOpen(false);
                signOut({ callbackUrl: '/' });
              }}
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