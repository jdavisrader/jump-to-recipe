/**
 * Enhanced error display component for My Recipes with retry mechanisms
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  LogIn, 
  Wifi, 
  Shield, 
  Server,
  Clock,
  Info
} from 'lucide-react';
import Link from 'next/link';
import type { MyRecipesError } from '@/lib/my-recipes-error-handler';

interface MyRecipesErrorDisplayProps {
  error: MyRecipesError;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryCount?: number;
  isRetrying?: boolean;
  showDismiss?: boolean;
  variant?: 'full' | 'inline' | 'toast';
  className?: string;
}

const ERROR_ICONS = {
  network: Wifi,
  auth: LogIn,
  permission: Shield,
  validation: Info,
  server: Server,
  unknown: AlertTriangle,
} as const;

const ERROR_COLORS = {
  network: 'bg-blue-100 text-blue-600',
  auth: 'bg-yellow-100 text-yellow-600',
  permission: 'bg-red-100 text-red-600',
  validation: 'bg-orange-100 text-orange-600',
  server: 'bg-purple-100 text-purple-600',
  unknown: 'bg-gray-100 text-gray-600',
} as const;

export function MyRecipesErrorDisplay({
  error,
  onRetry,
  onDismiss,
  retryCount = 0,
  isRetrying = false,
  showDismiss = false,
  variant = 'full',
  className = '',
}: MyRecipesErrorDisplayProps) {
  const Icon = ERROR_ICONS[error.type];
  const iconColorClass = ERROR_COLORS[error.type];

  const renderRetryInfo = () => {
    if (retryCount > 0 && error.retryable) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Retry attempt {retryCount}</span>
        </div>
      );
    }
    return null;
  };

  const renderActionButton = () => {
    switch (error.actionType) {
      case 'retry':
        return (
          <Button 
            onClick={onRetry} 
            disabled={isRetrying || !error.retryable}
            className="flex-1"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {error.actionLabel || 'Try Again'}
              </>
            )}
          </Button>
        );
      
      case 'login':
        return (
          <Button asChild className="flex-1">
            <Link href="/auth/login?callbackUrl=/my-recipes">
              <LogIn className="mr-2 h-4 w-4" />
              {error.actionLabel || 'Log In'}
            </Link>
          </Button>
        );
      
      case 'refresh':
        return (
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {error.actionLabel || 'Refresh Page'}
          </Button>
        );
      
      case 'home':
        return (
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {error.actionLabel || 'Go Home'}
            </Link>
          </Button>
        );
      
      default:
        return null;
    }
  };

  // Toast variant for less intrusive errors
  if (variant === 'toast') {
    return (
      <div className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconColorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">{error.userMessage}</p>
            {renderRetryInfo()}
          </div>
          <div className="flex items-center gap-2">
            {error.retryable && onRetry && (
              <Button 
                onClick={onRetry} 
                size="sm" 
                variant="ghost"
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
            {showDismiss && onDismiss && (
              <Button onClick={onDismiss} size="sm" variant="ghost">
                ×
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant for search/pagination errors
  if (variant === 'inline') {
    return (
      <div className={`border rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconColorClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{error.userMessage}</p>
            {renderRetryInfo()}
          </div>
          <div className="flex items-center gap-2">
            {renderActionButton()}
            {showDismiss && onDismiss && (
              <Button onClick={onDismiss} size="sm" variant="ghost">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full variant for major errors
  return (
    <div className={`flex min-h-[400px] items-center justify-center px-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconColorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-xl font-semibold">
              {error.type === 'auth' && 'Authentication Error'}
              {error.type === 'permission' && 'Access Denied'}
              {error.type === 'network' && 'Connection Error'}
              {error.type === 'server' && 'Server Error'}
              {error.type === 'validation' && 'Data Issue'}
              {error.type === 'unknown' && 'Something went wrong'}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {error.type}
            </Badge>
          </div>
          <CardDescription className="text-center">
            {error.userMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderRetryInfo()}
          
          {process.env.NODE_ENV === 'development' && error.originalError && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 rounded-md bg-muted p-3 text-xs font-mono">
                <div className="break-all">{error.originalError.message}</div>
                {error.context && (
                  <div className="mt-2 text-muted-foreground">
                    <div className="font-semibold">Context:</div>
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2">
          <div className="flex w-full gap-2">
            {renderActionButton()}
          </div>
          
          {error.actionType !== 'home' && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}