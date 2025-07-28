"use client";

import { useState } from "react";
import { ShoppingCart, Plus, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroceryListGenerator } from "@/components/grocery-lists/grocery-list-generator";
import { GroceryListManager } from "@/components/grocery-lists/grocery-list-manager";
import type { GroceryList } from "@/types/grocery-list";

type PageView = "overview" | "generator" | "manager";

export default function GroceryListsPage() {
  const [currentView, setCurrentView] = useState<PageView>("overview");

  const handleListGenerated = (_groceryList: GroceryList) => {
    // After generating a list, show the manager view
    setTimeout(() => {
      setCurrentView("manager");
    }, 2000); // Give user time to see the success message
  };

  if (currentView === "generator") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentView("overview")}
            className="mb-4"
          >
            ← Back to Grocery Lists
          </Button>
        </div>
        
        <GroceryListGenerator onListGenerated={handleListGenerated} />
      </div>
    );
  }

  if (currentView === "manager") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentView("overview")}
            className="mb-4"
          >
            ← Back to Grocery Lists
          </Button>
        </div>
        
        <GroceryListManager onCreateNew={() => setCurrentView("generator")} />
      </div>
    );
  }

  // Overview page
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Grocery Lists</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Generate smart grocery lists from your recipes with automatic ingredient 
            grouping and serving size adjustments. Never forget an ingredient again!
          </p>
        </div>

        {/* Action cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                Generate New List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Select recipes from your collection and automatically generate a 
                consolidated grocery list with smart ingredient grouping.
              </p>
              <Button 
                onClick={() => setCurrentView("generator")}
                className="w-full"
              >
                Start Generator
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-secondary/50 rounded-lg group-hover:bg-secondary/70 transition-colors">
                  <List className="h-6 w-6 text-secondary-foreground" />
                </div>
                Manage Existing Lists
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View, edit, and manage your saved grocery lists. Check off items 
                as you shop and track your progress.
              </p>
              <Button 
                onClick={() => setCurrentView("manager")}
                variant="secondary"
                className="w-full"
              >
                View My Lists
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Smart Grouping</h3>
                <p className="text-sm text-muted-foreground">
                  Ingredients automatically organized by store section
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Quantity Combining</h3>
                <p className="text-sm text-muted-foreground">
                  Overlapping ingredients merged to reduce waste
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
                  <List className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Serving Scaling</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust recipe servings with automatic quantity updates
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Check off items and track shopping progress
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}