/**
 * Visual Demo Component for DragHandle and DeleteButton
 * 
 * This component demonstrates the visual appearance and behavior of the
 * DragHandle and DeleteButton components. It's useful for:
 * - Visual testing during development
 * - Verifying hover states and interactions
 * - Ensuring components match the design system
 * 
 * To view this demo:
 * 1. Import this component in a page
 * 2. Run the dev server
 * 3. Navigate to the page to see the components in action
 * 
 * @example
 * ```tsx
 * import { UIComponentsDemo } from '@/components/ui/__tests__/ui-components-demo';
 * 
 * export default function DemoPage() {
 *   return <UIComponentsDemo />;
 * }
 * ```
 */

'use client';

import { useState } from 'react';
import { DragHandle } from '../drag-handle';
import { DeleteButton } from '../delete-button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Input } from '../input';

export function UIComponentsDemo() {
  const [items, setItems] = useState([
    { id: '1', name: 'Flour', amount: '2 cups' },
    { id: '2', name: 'Sugar', amount: '1 cup' },
    { id: '3', name: 'Eggs', amount: '3 large' },
  ]);

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>DragHandle & DeleteButton Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Components */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Components</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <DragHandle ariaLabel="Drag to reorder" />
                <span className="flex-1">Drag Handle (Default)</span>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <DragHandle isDragging={true} ariaLabel="Drag to reorder" />
                <span className="flex-1">Drag Handle (Dragging State)</span>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <DragHandle disabled={true} ariaLabel="Drag to reorder" />
                <span className="flex-1">Drag Handle (Disabled)</span>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <DeleteButton ariaLabel="Delete item" />
                <span className="flex-1">Delete Button (Outline)</span>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <DeleteButton variant="destructive" ariaLabel="Delete item" />
                <span className="flex-1">Delete Button (Destructive)</span>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <DeleteButton variant="ghost" ariaLabel="Delete item" />
                <span className="flex-1">Delete Button (Ghost)</span>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <DeleteButton disabled={true} ariaLabel="Delete item" />
                <span className="flex-1">Delete Button (Disabled)</span>
              </div>
            </div>
          </div>

          {/* Ingredient List Example */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ingredient List Example</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-2 items-center p-2 border rounded-lg hover:bg-accent/50 transition-colors">
                  <DragHandle ariaLabel={`Drag to reorder ${item.name}`} />
                  <Input 
                    value={item.amount} 
                    className="w-32" 
                    readOnly 
                  />
                  <Input 
                    value={item.name} 
                    className="flex-1" 
                    readOnly 
                  />
                  <DeleteButton 
                    onDelete={() => handleDelete(item.id)}
                    ariaLabel={`Delete ${item.name}`}
                  />
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  All items deleted. Refresh to reset.
                </p>
              )}
            </div>
          </div>

          {/* Hover State Instructions */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Interaction Guide:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Hover over the drag handle to see the cursor change to "grab"</li>
              <li>• Hover over the delete button to see the hover effect</li>
              <li>• Click delete buttons to remove items from the list</li>
              <li>• Tab through elements to test keyboard accessibility</li>
              <li>• Focus indicators should appear on keyboard navigation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
