'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface CTAButtonsProps {
  primary?: {
    text: string;
    href: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  };
  secondary?: {
    text: string;
    href: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  };
  className?: string;
}

export function CTAButtons({
  primary = { text: 'Get Started', href: '/auth/register', variant: 'default', size: 'lg' },
  secondary = { text: 'Sign In', href: '/auth/login', variant: 'outline', size: 'lg' },
  className = '',
}: CTAButtonsProps) {
  const { status } = useSession();
  
  // Don't show auth buttons if user is already authenticated
  if (status === 'authenticated') {
    return (
      <div className={`flex flex-col gap-2 min-[400px]:flex-row ${className}`}>
        <Button asChild size={primary.size || 'lg'} variant={primary.variant || 'default'}>
          <Link href="/recipes">Browse Recipes</Link>
        </Button>
        <Button asChild size={secondary.size || 'lg'} variant={secondary.variant || 'outline'}>
          <Link href="/cookbooks">My Cookbooks</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col gap-2 min-[400px]:flex-row ${className}`}>
      <Button asChild size={primary.size || 'lg'} variant={primary.variant || 'default'}>
        <Link href={primary.href}>{primary.text}</Link>
      </Button>
      <Button asChild size={secondary.size || 'lg'} variant={secondary.variant || 'outline'}>
        <Link href={secondary.href}>{secondary.text}</Link>
      </Button>
    </div>
  );
}