"use client";

import { useState } from "react";
import { Check, Edit2, Trash2, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { GroceryList, GroceryItem, GroceryCategory } from "@/types/grocery-list";

interface GroceryListDisplayProps {
  groceryList: GroceryList;
  onItemToggle: (itemId: string) => void;
  onItemUpdate: (itemId: string, updates: Partial<GroceryItem>) => void;
  onItemDelete: (itemId: string) => void;
  editable?: boolean;
}

const CATEGORY_ICONS: Record<GroceryCategory, React.ComponentType<{ className?: string }>> = {
  produce: Package,
  dairy: Package,
  meat: Package,
  seafood: Package,
  pantry: Package,
  spices: Package,
  condiments: Package,
  frozen: Package,
  bakery: Package,
  beverages: Package,
  other: Package,
};

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: "Produce",
  dairy: "Dairy & Eggs",
  meat: "Meat & Poultry",
  seafood: "Seafood",
  pantry: "Pantry",
  spices: "Spices & Seasonings",
  condiments: "Condiments & Oils",
  frozen: "Frozen",
  bakery: "Bakery",
  beverages: "Beverages",
  other: "Other",
};

export function GroceryListDisplay({
  groceryList,
  onItemToggle,
  onItemUpdate,
  onItemDelete,
  editable = true,
}: GroceryListDisplayProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  // Group items by category
  const itemsByCategory = groceryList.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<GroceryCategory, GroceryItem[]>);

  // Filter items based on completion status
  const filteredItemsByCategory = Object.entries(itemsByCategory).reduce((acc, [category, items]) => {
    const filteredItems = showCompleted ? items : items.filter(item => !item.isCompleted);
    if (filteredItems.length > 0) {
      acc[category as GroceryCategory] = filteredItems;
    }
    return acc;
  }, {} as Record<GroceryCategory, GroceryItem[]>);

  const totalItems = groceryList.items.length;
  const completedItems = groceryList.items.filter(item => item.isCompleted).length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const handleItemEdit = (item: GroceryItem, field: keyof GroceryItem, value: unknown) => {
    onItemUpdate(item.id, { [field]: value });
    if (field !== 'notes') {
      setEditingItem(null);
    }
  };

  const formatAmount = (item: GroceryItem) => {
    if (item.displayAmount) {
      return item.displayAmount;
    }
    return `${item.amount} ${item.unit}`.trim();
  };

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {groceryList.title}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {completedItems} of {totalItems} items
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              />
              <span className="text-sm">Show completed items</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grocery list by category */}
      <div className="space-y-4">
        {Object.entries(filteredItemsByCategory).map(([category, items]) => {
          const CategoryIcon = CATEGORY_ICONS[category as GroceryCategory];
          
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CategoryIcon className="h-4 w-4" />
                  {CATEGORY_LABELS[category as GroceryCategory]}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({items.length})
                  </span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        item.isCompleted 
                          ? "bg-secondary/50 opacity-75" 
                          : "bg-background hover:bg-accent/50"
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => onItemToggle(item.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          item.isCompleted
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 hover:border-primary/50"
                        }`}
                      >
                        {item.isCompleted && <Check className="h-3 w-3" />}
                      </button>

                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {editingItem === `${item.id}-name` ? (
                            <Input
                              value={item.name}
                              onChange={(e) => handleItemEdit(item, 'name', e.target.value)}
                              onBlur={() => setEditingItem(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingItem(null);
                                if (e.key === 'Escape') setEditingItem(null);
                              }}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`font-medium cursor-pointer hover:text-primary ${
                                item.isCompleted ? "line-through" : ""
                              }`}
                              onClick={() => editable && setEditingItem(`${item.id}-name`)}
                            >
                              {item.name}
                            </span>
                          )}

                          {editingItem === `${item.id}-amount` ? (
                            <Input
                              value={formatAmount(item)}
                              onChange={(e) => {
                                // Simple parsing - in a real app you'd want more sophisticated parsing
                                const parts = e.target.value.split(' ');
                                const amount = parseFloat(parts[0]) || item.amount;
                                const unit = parts.slice(1).join(' ') || item.unit;
                                handleItemEdit(item, 'amount', amount);
                                if (unit !== item.unit) {
                                  handleItemEdit(item, 'unit', unit);
                                }
                              }}
                              onBlur={() => setEditingItem(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingItem(null);
                                if (e.key === 'Escape') setEditingItem(null);
                              }}
                              className="h-6 text-sm w-24"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`text-sm text-muted-foreground cursor-pointer hover:text-primary ${
                                item.isCompleted ? "line-through" : ""
                              }`}
                              onClick={() => editable && setEditingItem(`${item.id}-amount`)}
                            >
                              {formatAmount(item)}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {editingItem === `${item.id}-notes` ? (
                              <Input
                                value={item.notes}
                                onChange={(e) => handleItemEdit(item, 'notes', e.target.value)}
                                onBlur={() => setEditingItem(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') setEditingItem(null);
                                  if (e.key === 'Escape') setEditingItem(null);
                                }}
                                className="h-6 text-xs"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:text-primary"
                                onClick={() => editable && setEditingItem(`${item.id}-notes`)}
                              >
                                {item.notes}
                              </span>
                            )}
                          </div>
                        )}

                        {item.recipeIds.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            From {item.recipeIds.length} recipe{item.recipeIds.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {editable && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem(`${item.id}-name`)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onItemDelete(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.keys(filteredItemsByCategory).length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">
              {showCompleted 
                ? "No items in this grocery list." 
                : "All items completed! Toggle 'Show completed items' to see them."}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}