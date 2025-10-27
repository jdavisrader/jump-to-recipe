'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './section-header';
import { cn } from '@/lib/utils';
import './section-animations.css';

export interface Section<T = any> {
  id: string;
  name: string;
  order: number;
  items: T[];
}

interface SectionManagerProps<T> {
  sections: Section<T>[];
  onSectionsChange: (sections: Section<T>[]) => void;
  onAddItem: (sectionId: string) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  renderItem: (item: T, index: number, sectionId: string) => React.ReactNode;
  itemType: 'ingredient' | 'instruction';
  className?: string;
  addSectionLabel?: string;
  addItemLabel?: string;
  isLoading?: boolean;
  isAddingSection?: boolean;
  isAddingItem?: Record<string, boolean>;
}

export function SectionManager<T extends { id: string }>({
  sections,
  onSectionsChange,
  onAddItem,
  onRemoveItem,
  renderItem,
  itemType,
  className,
  addSectionLabel,
  addItemLabel,
  isLoading = false,
  isAddingSection = false,
  isAddingItem = {}
}: SectionManagerProps<T>) {
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  const defaultAddSectionLabel = `Add ${itemType === 'ingredient' ? 'Ingredient' : 'Instruction'} Section`;
  const defaultAddItemLabel = `Add ${itemType === 'ingredient' ? 'Ingredient' : 'Step'}`;

  const handleAddSection = () => {
    const newSection: Section<T> = {
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: 'Untitled Section',
      order: sections.length,
      items: []
    };

    onSectionsChange([...sections, newSection]);
  };

  const handleSectionRename = (sectionId: string, newName: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, name: newName }
        : section
    );
    onSectionsChange(updatedSections);
  };

  const handleSectionDelete = (sectionId: string) => {
    const updatedSections = sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, order: index }));

    onSectionsChange(updatedSections);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggedSectionId(null);

    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    // Only handle section reordering for now
    if (result.type === 'section') {
      const reorderedSections = Array.from(sections);
      const [removed] = reorderedSections.splice(source.index, 1);
      reorderedSections.splice(destination.index, 0, removed);

      // Update order property
      const updatedSections = reorderedSections.map((section, index) => ({
        ...section,
        order: index
      }));

      onSectionsChange(updatedSections);
    }
  };

  const handleDragStart = (result: any) => {
    if (result.type === 'section') {
      setDraggedSectionId(result.draggableId);
    }
  };

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <div className="section-skeleton h-12 w-full rounded-lg" />
            <div className="ml-6 space-y-2">
              <div className="section-skeleton h-8 w-3/4 rounded" />
              <div className="section-skeleton h-8 w-1/2 rounded" />
            </div>
          </div>
        ))}
        <div className="section-skeleton h-10 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable droppableId="sections" type="section">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={cn(
                'space-y-6 p-2',
                snapshot?.isDraggingOver && 'section-drop-zone-active'
              )}
            >
              {sortedSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-gray-500 dark:text-gray-400 text-center">
                    <div className="text-lg font-medium mb-2">No sections yet</div>
                    <div className="text-sm">
                      Create your first {itemType} section to organize your recipe
                    </div>
                  </div>
                </div>
              ) : (
                sortedSections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          // Base section container styling
                          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm',
                          // Only transition hover effects, no transitions during drag/drop
                          !snapshot.isDragging && !draggedSectionId && 'transition-[box-shadow,border-color,background-color] duration-200 ease-in-out',
                          // Spacing and layout
                          'p-4 space-y-3 mb-6',
                          // Drag states
                          snapshot.isDragging && 'section-drag-preview shadow-2xl border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20',
                          !snapshot.isDragging && 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600',
                          // Placeholder state for the original position
                          draggedSectionId === section.id && !snapshot.isDragging && 'section-drag-placeholder'
                        )}
                        style={{
                          ...provided.draggableProps.style,
                          // Improved drag transform with better visual feedback
                          transform: snapshot.isDragging
                            ? `${provided.draggableProps.style?.transform} rotate(1deg) scale(1.02)`
                            : provided.draggableProps.style?.transform,
                        }}
                      >
                        {/* Section Header with drag handle */}
                        <div {...provided.dragHandleProps}>
                          <SectionHeader
                            section={section}
                            onRename={handleSectionRename}
                            onDelete={handleSectionDelete}
                            canDelete={sections.length > 1}
                            isDragging={snapshot.isDragging}
                          />
                        </div>

                        {/* Section Items */}
                        <div className="space-y-3 mt-4">
                          {section.items.length === 0 && (
                            <div className="flex items-center gap-2 p-3 border-2 border-dashed border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-700 dark:text-amber-300 text-sm section-empty-indicator">
                              <div className="flex-shrink-0 w-2 h-2 bg-amber-400 dark:bg-amber-500 rounded-full section-empty-dot"></div>
                              <span>This section is empty. Add {itemType === 'ingredient' ? 'ingredients' : 'steps'} below.</span>
                            </div>
                          )}

                          {section.items.map((item, itemIndex) => (
                            <div
                              key={item.id}
                              className="section-item-enter"
                            >
                              {renderItem(item, itemIndex, section.id)}
                            </div>
                          ))}

                          {/* Add Item Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onAddItem(section.id)}
                            disabled={isAddingItem[section.id]}
                            className={cn(
                              "text-sm section-button",
                              isAddingItem[section.id] && "animate-pulse"
                            )}
                          >
                            {isAddingItem[section.id] ? (
                              <Loader2 className="h-4 w-4 mr-2 section-spinner" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            {addItemLabel || defaultAddItemLabel}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Section Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleAddSection}
        disabled={isAddingSection}
        className={cn(
          "w-full section-button",
          isAddingSection && "animate-pulse"
        )}
      >
        {isAddingSection ? (
          <Loader2 className="h-4 w-4 mr-2 section-spinner" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        {addSectionLabel || defaultAddSectionLabel}
      </Button>
    </div>
  );
}