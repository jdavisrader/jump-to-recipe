'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Update state with error info
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[300px] items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-600">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-center">
                An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 rounded-md bg-muted p-3 text-xs font-mono">
                    <div className="break-all">{this.state.error.message}</div>
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2 text-muted-foreground">
                        <div className="font-semibold">Component Stack:</div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2">
              <div className="flex w-full gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                  Refresh Page
                </Button>
              </div>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
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
 * Hook-based error boundary for functional components
 * This is a wrapper around the class-based ErrorBoundary
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ErrorBoundaryWrapper({ children, fallback, onError }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}