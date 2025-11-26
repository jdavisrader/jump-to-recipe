'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ImageOff } from 'lucide-react';

interface PhotoErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface PhotoErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * Error Boundary specifically for photo-related components
 * Provides photo-specific error handling and recovery options
 */
export class PhotoErrorBoundary extends Component<PhotoErrorBoundaryProps, PhotoErrorBoundaryState> {
  constructor(props: PhotoErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PhotoErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PhotoErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  getErrorMessage(): string {
    const error = this.state.error;
    
    if (!error) {
      return 'An unexpected error occurred with the photo feature';
    }

    // Provide user-friendly messages for common photo errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error while loading photos. Please check your connection and try again.';
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'You do not have permission to access these photos.';
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'Photos not found. They may have been deleted.';
    }

    if (error.message.includes('size') || error.message.includes('limit')) {
      return 'Photo size or count limit exceeded.';
    }

    if (error.message.includes('format') || error.message.includes('type')) {
      return 'Invalid photo format. Please use JPEG, PNG, or WebP images.';
    }

    return 'An error occurred while managing photos. Please try again.';
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                <ImageOff className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg font-semibold">
                Photo Error
              </CardTitle>
              <CardDescription className="text-center">
                {this.getErrorMessage()}
              </CardDescription>
            </CardHeader>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <CardContent>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 rounded-md bg-muted p-3 text-xs font-mono">
                    <div className="break-all">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              </CardContent>
            )}
            
            <CardFooter className="flex flex-col gap-2">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight photo error display for inline errors
 */
interface PhotoErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function PhotoErrorDisplay({ error, onRetry, className }: PhotoErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/10 ${className || ''}`}>
      <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">Photo Error</span>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {errorMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Photo loading error placeholder
 */
interface PhotoLoadErrorProps {
  fileName?: string;
  onRemove?: () => void;
  className?: string;
}

export function PhotoLoadError({ fileName, onRemove, className }: PhotoLoadErrorProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10 ${className || ''}`}>
      <ImageOff className="h-8 w-8 text-red-400" />
      <p className="text-xs text-center text-red-600 dark:text-red-400">
        Failed to load photo
      </p>
      {fileName && (
        <p className="text-xs text-center text-muted-foreground truncate max-w-full">
          {fileName}
        </p>
      )}
      {onRemove && (
        <Button onClick={onRemove} size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
          Remove
        </Button>
      )}
    </div>
  );
}
