'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RecipeCard } from '@/components/recipes';
import { CookbookRecipeOrganizer } from '@/components/cookbooks/cookbook-recipe-organizer';
import { Loader2, Search, ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Recipe } from '@/types/recipe';

export default function AddRecipesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cookbook, setCookbook] = useState<any>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  
  const cookbookId = params.id;
  
  // Fetch cookbook and user recipes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cookbook
        const cookbookRes = await fetch(`/api/cookbooks/${cookbookId}`);
        
        if (!cookbookRes.ok) {
          throw new Error('Failed to fetch cookbook');
        }
        
        const cookbookData = await cookbookRes.json();
        setCookbook(cookbookData.cookbook);
        
        // Get IDs of recipes already in cookbook
        const existingRecipeIds = new Set(
          cookbookData.cookbook.recipes.map((item: any) => item.recipe.id)
        );
        
        // Fetch user recipes
        const recipesRes = await fetch('/api/recipes?limit=100');
        
        if (!recipesRes.ok) {
          throw new Error('Failed to fetch recipes');
        }
        
        const recipesData = await recipesRes.json();
        
        // Filter out recipes already in cookbook
        const availableRecipes = recipesData.recipes.filter(
          (recipe: Recipe) => !existingRecipeIds.has(recipe.id)
        );
        
        setUserRecipes(availableRecipes);
        setFilteredRecipes(availableRecipes);
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [cookbookId, toast]);
  
  // Filter recipes based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipes(userRecipes);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = userRecipes.filter(recipe => 
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    setFilteredRecipes(filtered);
  }, [searchQuery, userRecipes]);
  
  const toggleRecipeSelection = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    
    setSelectedRecipes(newSelected);
  };
  
  const handleAddSelectedRecipes = async () => {
    if (selectedRecipes.size === 0) return;
    
    setIsAdding(true);
    
    try {
      // Get current recipes in cookbook
      const currentRecipes = cookbook.recipes || [];
      const highestPosition = currentRecipes.length > 0
        ? Math.max(...currentRecipes.map((item: any) => item.position))
        : -1;
      
      // Prepare new recipes to add
      const recipesToAdd = Array.from(selectedRecipes).map((recipeId, index) => ({
        recipeId,
        position: highestPosition + 1 + index,
      }));
      
      // Get current recipe IDs
      const currentRecipeIds = currentRecipes.map((item: any) => ({
        recipeId: item.recipe.id,
        position: item.position,
      }));
      
      // Combine current and new recipes
      const allRecipes = [...currentRecipeIds, ...recipesToAdd];
      
      // Update cookbook
      const response = await fetch(`/api/cookbooks/${cookbookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipes: allRecipes,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add recipes');
      }
      
      toast({
        title: 'Recipes added',
        description: `Added ${selectedRecipes.size} recipes to your cookbook`,
      });
      
      // Refresh the page to show updated cookbook
      router.refresh();
      router.push(`/cookbooks/${cookbookId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add recipes',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleSaveOrder = () => {
    router.refresh();
    router.push(`/cookbooks/${cookbookId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cookbook) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-muted-foreground">Cookbook not found</p>
        <Button asChild className="mt-4">
          <Link href="/cookbooks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cookbooks
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Cookbook: {cookbook.title}</h1>
        <Button asChild variant="outline">
          <Link href={`/cookbooks/${cookbookId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cookbook
          </Link>
        </Button>
      </div>
      
      {/* Current Recipes */}
      {cookbook.recipes && cookbook.recipes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Current Recipes</h2>
          <Card>
            <CardContent className="pt-6">
              <CookbookRecipeOrganizer
                cookbookId={cookbookId}
                recipes={cookbook.recipes}
                onSave={handleSaveOrder}
              />
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Add Recipes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Add Recipes</h2>
        
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            onClick={handleAddSelectedRecipes}
            disabled={selectedRecipes.size === 0 || isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Selected ({selectedRecipes.size})
          </Button>
        </div>
        
        {filteredRecipes.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">
                {userRecipes.length === 0
                  ? 'You don\'t have any recipes to add'
                  : 'No recipes match your search'}
              </p>
              {userRecipes.length === 0 && (
                <Button asChild className="mt-4">
                  <Link href="/recipes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Recipe
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`cursor-pointer transition-all ${
                  selectedRecipes.has(recipe.id)
                    ? 'ring-2 ring-primary rounded-lg scale-[1.02]'
                    : ''
                }`}
                onClick={() => toggleRecipeSelection(recipe.id)}
              >
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}