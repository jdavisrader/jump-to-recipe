"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, ShoppingCart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroceryListDisplay } from "./grocery-list-display";
import type { GroceryList, GroceryItem } from "@/types/grocery-list";

interface GroceryListManagerProps {
  onCreateNew?: () => void;
}

export function GroceryListManager({ onCreateNew }: GroceryListManagerProps) {
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [selectedList, setSelectedList] = useState<GroceryList | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);

  // Fetch grocery lists
  useEffect(() => {
    fetchGroceryLists();
  }, []);

  const fetchGroceryLists = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/grocery-list");
      
      if (!response.ok) {
        throw new Error("Failed to fetch grocery lists");
      }
      
      const data = await response.json();
      setGroceryLists(data.groceryLists || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load grocery lists");
    } finally {
      setLoading(false);
    }
  };

  const updateGroceryList = async (listId: string, updates: Partial<GroceryList>) => {
    try {
      const response = await fetch(`/api/grocery-list/${listId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to update grocery list");
      }

      const updatedList = await response.json();
      
      // Update local state
      setGroceryLists(prev => 
        prev.map(list => list.id === listId ? updatedList : list)
      );
      
      if (selectedList?.id === listId) {
        setSelectedList(updatedList);
      }
      
      return updatedList;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update grocery list");
      throw err;
    }
  };

  const deleteGroceryList = async (listId: string) => {
    if (!confirm("Are you sure you want to delete this grocery list?")) {
      return;
    }

    try {
      const response = await fetch(`/api/grocery-list/${listId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete grocery list");
      }

      // Update local state
      setGroceryLists(prev => prev.filter(list => list.id !== listId));
      
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete grocery list");
    }
  };

  const handleItemToggle = async (itemId: string) => {
    if (!selectedList) return;

    const updatedItems = selectedList.items.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );

    try {
      await updateGroceryList(selectedList.id, { items: updatedItems });
    } catch {
      // Error handling is done in updateGroceryList
    }
  };

  const handleItemUpdate = async (itemId: string, updates: Partial<GroceryItem>) => {
    if (!selectedList) return;

    const updatedItems = selectedList.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    try {
      await updateGroceryList(selectedList.id, { items: updatedItems });
    } catch {
      // Error handling is done in updateGroceryList
    }
  };

  const handleItemDelete = async (itemId: string) => {
    if (!selectedList) return;

    const updatedItems = selectedList.items.filter(item => item.id !== itemId);

    try {
      await updateGroceryList(selectedList.id, { items: updatedItems });
    } catch {
      // Error handling is done in updateGroceryList
    }
  };

  const handleTitleUpdate = async (listId: string, newTitle: string) => {
    try {
      await updateGroceryList(listId, { title: newTitle });
      setEditingTitle(null);
    } catch {
      // Error handling is done in updateGroceryList
    }
  };

  // Filter lists based on search query
  const filteredLists = groceryLists.filter(list =>
    list.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getListProgress = (list: GroceryList) => {
    const totalItems = list.items.length;
    const completedItems = list.items.filter(item => item.isCompleted).length;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading grocery lists...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-destructive">{error}</div>
            <Button onClick={fetchGroceryLists} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedList ? (
        // List view
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  My Grocery Lists
                </CardTitle>
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New List
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search grocery lists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Lists */}
              <div className="space-y-3">
                {filteredLists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery 
                      ? "No grocery lists found matching your search." 
                      : "No grocery lists yet. Create your first one!"}
                  </div>
                ) : (
                  filteredLists.map((list) => {
                    const progress = getListProgress(list);
                    
                    return (
                      <Card
                        key={list.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedList(list)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {editingTitle === list.id ? (
                                  <Input
                                    value={list.title}
                                    onChange={(e) => {
                                      const updatedLists = groceryLists.map(l =>
                                        l.id === list.id ? { ...l, title: e.target.value } : l
                                      );
                                      setGroceryLists(updatedLists);
                                    }}
                                    onBlur={() => handleTitleUpdate(list.id, list.title)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleTitleUpdate(list.id, list.title);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingTitle(null);
                                        fetchGroceryLists(); // Reset to original title
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-6 font-medium"
                                    autoFocus
                                  />
                                ) : (
                                  <h3 className="font-medium truncate">{list.title}</h3>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span>{list.items.length} items</span>
                                <span>{progress}% complete</span>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(list.updatedAt)}
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                                <div
                                  className="bg-primary h-1.5 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTitle(list.id);
                                }}
                                className="h-8 w-8"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteGroceryList(list.id);
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // Detail view
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedList(null)}
            >
              ← Back to Lists
            </Button>
            <Button
              variant="outline"
              onClick={() => deleteGroceryList(selectedList.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete List
            </Button>
          </div>

          <GroceryListDisplay
            groceryList={selectedList}
            onItemToggle={handleItemToggle}
            onItemUpdate={handleItemUpdate}
            onItemDelete={handleItemDelete}
            editable={true}
          />
        </div>
      )}
    </div>
  );
}