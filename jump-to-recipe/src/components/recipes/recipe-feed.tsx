'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, Star, Sparkles } from 'lucide-react';
import type { Recipe } from '@/types/recipe';

interface FeedData {
  recent?: Recipe[];
  popular?: Recipe[];
  trending?: Recipe[];
  recommended?: Recipe[];
}

interface RecipeFeedProps {
  initialData?: FeedData;
}

interface FeedSection {
  key: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  recipes: Recipe[];
}

export function RecipeFeed({ initialData }: RecipeFeedProps) {
  const [feedData, setFeedData] = useState<FeedData>(initialData || {});
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      fetchFeedData();
    }
  }, [initialData]);

  const fetchFeedData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch 3 recipes per section for the home page preview
      const response = await fetch('/api/recipes/discover?limit=4');
      if (!response.ok) {
        throw new Error('Failed to fetch feed data');
      }

      const data = await response.json();
      setFeedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sections: FeedSection[] = [
    {
      key: 'recent',
      title: 'Recently Added',
      icon: <Clock className="h-5 w-5" />,
      description: 'Fresh recipes from our community',
      recipes: feedData.recent || []
    },
    {
      key: 'popular',
      title: 'Most Popular',
      icon: <Star className="h-5 w-5" />,
      description: 'Recipes loved by our community',
      recipes: feedData.popular || []
    },
    {
      key: 'trending',
      title: 'Trending This Week',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Hot recipes gaining popularity',
      recipes: feedData.trending || []
    },
    {
      key: 'recommended',
      title: 'Recommended for You',
      icon: <Sparkles className="h-5 w-5" />,
      description: 'Personalized recipe suggestions',
      recipes: feedData.recommended || []
    }
  ];

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Failed to load recipe feed</p>
        <Button onClick={() => fetchFeedData()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {sections.map((section) => (
        <FeedSection
          key={section.key}
          section={section}
          loading={loading}
        />
      ))}
    </div>
  );
}

interface FeedSectionProps {
  section: FeedSection;
  loading: boolean;
}

function FeedSection({ section, loading }: FeedSectionProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (section.recipes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            {section.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{section.title}</h2>
            <p className="text-muted-foreground">{section.description}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/recipes?sortBy=${getSortByForSection(section.key)}`}>
            View All
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {section.recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            showAuthor={true}
          />
        ))}
      </div>

      {/* View All Link */}
      {section.recipes.length > 0 && (
        <div className="text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/recipes?sortBy=${getSortByForSection(section.key)}`}>
              View All {section.title} →
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function getSortByForSection(sectionKey: string): string {
  switch (sectionKey) {
    case 'recent':
      return 'newest';
    case 'popular':
      return 'popular';
    case 'trending':
      return 'popular';
    case 'recommended':
      return 'popular';
    default:
      return 'newest';
  }
}

