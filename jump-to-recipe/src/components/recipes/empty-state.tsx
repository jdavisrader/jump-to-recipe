import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  className
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center py-8 sm:py-12 lg:py-16 px-4 space-y-4 sm:space-y-6",
        className
      )}
      role="region"
      aria-labelledby="empty-state-title"
      aria-describedby="empty-state-description"
    >
      {icon && (
        <div 
          className="text-muted-foreground/60"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      
      <div className="space-y-2 sm:space-y-3 max-w-md lg:max-w-lg">
        <h2 
          className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground"
          id="empty-state-title"
        >
          {title}
        </h2>
        <p 
          className="text-muted-foreground text-sm sm:text-base leading-relaxed"
          id="empty-state-description"
        >
          {description}
        </p>
      </div>

      <Button 
        asChild 
        size="lg"
        className="w-full sm:w-auto min-w-48"
        aria-describedby="empty-state-title empty-state-description"
      >
        <Link href={actionHref}>
          {actionLabel}
        </Link>
      </Button>
    </div>
  );
}