/**
 * Visual Feedback Demo Component
 * 
 * This component demonstrates the visual feedback enhancements for drag-and-drop operations.
 * It's not a test file but rather a visual demonstration of the implemented features.
 * 
 * To use this demo:
 * 1. Import this component in a page
 * 2. Interact with the drag-and-drop operations
 * 3. Observe the visual feedback:
 *    - Ghost image with opacity and scale
 *    - Drop target highlighting
 *    - Smooth animations
 *    - Screen reader announcements
 */

'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DragHandle } from '@/components/ui/drag-handle';
import { DeleteButton } from '@/components/ui/delete-button';
import '../drag-feedback.css';

interface DemoItem {
  id: string;
  name: string;
  description: string;
}

export function VisualFeedbackDemo() {
  const [items, setItems] = useState<DemoItem[]>([
    { id: '1', name: 'Flour', description: '2 cups' },
    { id: '2', name: 'Sugar', description: '1 cup' },
    { id: '3', name: 'Eggs', description: '3 large' },
    { id: '4', name: 'Butter', description: '1/2 cup' },
    { id: '5', name: 'Vanilla', description: '1 tsp' },
  ]);

  const [announcement, setAnnouncement] = useState('');

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      setAnnouncement('Drag cancelled');
      return;
    }

    if (source.index === destination.index) {
      setAnnouncement('Item returned to original position');
      return;
    }

    const newItems = Array.from(items);
    const [removed] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, removed);

    setItems(newItems);
    setAnnouncement(
      `Moved ${removed.name} from position ${source.index + 1} to position ${destination.index + 1}`
    );
  };

  const handleDelete = (id: string) => {
    const item = items.find((i) => i.id === id);
    setItems(items.filter((i) => i.id !== id));
    setAnnouncement(`Deleted ${item?.name || 'item'}`);
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Visual Feedback Demo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag items to see the visual feedback enhancements
        </p>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="demo-list">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 transition-all duration-200 ${
                  snapshot.isDraggingOver
                    ? 'bg-accent/30 rounded-lg p-4 ring-2 ring-primary ring-offset-2'
                    : 'p-2'
                }`}
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex gap-3 items-center p-3 bg-card border rounded-lg ${
                          snapshot.isDragging
                            ? 'opacity-60 bg-card shadow-2xl border-2 border-primary scale-105 z-50'
                            : 'hover:shadow-md'
                        }`}
                        style={provided.draggableProps.style}
                      >
                        <div {...provided.dragHandleProps}>
                          <DragHandle
                            isDragging={snapshot.isDragging}
                            ariaLabel={`Drag to reorder ${item.name}`}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>

                        <DeleteButton
                          onDelete={() => handleDelete(item.id)}
                          ariaLabel={`Delete ${item.name}`}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Screen reader announcements */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>

        {/* Visual feedback indicators */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Visual Feedback Features:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✓ Ghost image with opacity and scale during drag</li>
            <li>✓ Drop target highlighting with ring and background</li>
            <li>✓ Smooth animations on drop</li>
            <li>✓ Cursor changes (grab/grabbing)</li>
            <li>✓ Screen reader announcements</li>
            <li>✓ Light and dark mode support</li>
          </ul>
        </div>

        {/* Last announcement display */}
        {announcement && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm">
              <strong>Last action:</strong> {announcement}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
