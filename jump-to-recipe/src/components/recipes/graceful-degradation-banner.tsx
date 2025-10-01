/**
 * Banner component for displaying graceful degradation warnings
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  X, 
  Search, 
  ChevronRight,
  Info
} from 'lucide-react';

interface GracefulDegradationBannerProps {
  message: string;
  disabledFeatures: string[];
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

const FEATURE_ICONS = {
  search: Search,
  pagination: ChevronRight,
  filters: Info,
} as const;

const FEATURE_LABELS = {
  search: 'Search',
  pagination: 'Load More',
  filters: 'Filters',
} as const;

export function GracefulDegradationBanner({
  message,
  disabledFeatures,
  onDismiss,
  showDetails = true,
  className = '',
}: GracefulDegradationBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!message && disabledFeatures.length === 0) {
    return null;
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-yellow-800">
              Limited Functionality
            </p>
            {disabledFeatures.length > 0 && (
              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                {disabledFeatures.length} feature{disabledFeatures.length !== 1 ? 's' : ''} disabled
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-yellow-700 mb-2">
            {message}
          </p>
          
          {showDetails && disabledFeatures.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-yellow-600 hover:text-yellow-800 flex items-center gap-1"
              >
                {isExpanded ? 'Hide' : 'Show'} disabled features
                <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
              
              {isExpanded && (
                <div className="flex flex-wrap gap-2">
                  {disabledFeatures.map((feature) => {
                    const Icon = FEATURE_ICONS[feature as keyof typeof FEATURE_ICONS] || Info;
                    const label = FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS] || feature;
                    
                    return (
                      <div
                        key={feature}
                        className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded text-xs text-yellow-700"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {onDismiss && (
          <Button
            onClick={onDismiss}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}