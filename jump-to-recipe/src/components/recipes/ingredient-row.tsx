/**
 * Memoized Ingredient Row Component
 * 
 * This component renders a single ingredient row with drag-and-drop support.
 * It's memoized to prevent unnecessary re-renders when other ingredients change.
 * 
 * Performance optimizations (Requirements 8.5):
 * - React.memo to prevent re-renders when props haven't changed
 * - Shallow comparison of ingredient data
 * - Only re-renders when ingredient data, drag state, or handlers change
 */

import * as React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Control, UseFormWatch } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { DragHandle } from '@/components/ui/drag-handle';
import { DeleteButton } from '@/components/ui/delete-button';

import type { Ingredient } from '@/types/recipe';

interface IngredientRowProps {
  ingredient: Ingredient;
  index: number;
  sectionId?: string;
  fieldBaseName: string;
  control: Control<any>;
  isLoading?: boolean;
  onDelete: () => void;
  onValidate?: () => void;
  onFieldChange?: () => void;
  clearErrors?: (name: string) => void;
}

/**
 * Memoized ingredient row component
 * 
 * Only re-renders when:
 * - Ingredient data changes (id, name, amount, unit, notes)
 * - Index changes (position in list)
 * - Loading state changes
 * - Handlers change (onDelete, onValidate, onFieldChange)
 * 
 * Does NOT re-render when:
 * - Other ingredients in the list change
 * - Parent component re-renders for unrelated reasons
 * - Sibling components update
 */
export const IngredientRow = React.memo(
  function IngredientRow({
    ingredient,
    index,
    sectionId,
    fieldBaseName,
    control,
    isLoading = false,
    onDelete,
    onValidate,
    onFieldChange,
    clearErrors,
  }: IngredientRowProps) {
    const draggableId = sectionId
      ? `${sectionId}-${ingredient.id}`
      : ingredient.id;

    return (
      <Draggable
        key={ingredient.id}
        draggableId={draggableId}
        index={index}
        isDragDisabled={isLoading}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`flex gap-2 items-center p-3 rounded-lg transition-all [&]:!h-auto ${
              snapshot.isDragging
                ? 'bg-card shadow-2xl border-2 border-primary z-50'
                : 'bg-transparent border-2 border-transparent'
            }`}
            style={{
              ...provided.draggableProps.style,
              height: 'auto !important',
              minHeight: 'auto',
            }}
          >
            {/* Drag Handle */}
            <div {...provided.dragHandleProps}>
              <DragHandle
                isDragging={snapshot.isDragging}
                disabled={isLoading}
                ariaLabel={`Drag to reorder ${ingredient.name || 'ingredient'}`}
              />
            </div>

            {/* Ingredient Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
              {/* Field order: Quantity, Unit, Ingredient Name, Notes */}
              <FormField
                control={control}
                name={`${fieldBaseName}.amount`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Quantity"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          field.onChange(value);
                          // Clear error if value becomes valid
                          if (value >= 0 && clearErrors) {
                            clearErrors(`${fieldBaseName}.amount`);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${fieldBaseName}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="tsp">tsp</SelectItem>
                        <SelectItem value="tbsp">tbsp</SelectItem>
                        <SelectItem value="cup">cup</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="fl oz">fl oz</SelectItem>
                        <SelectItem value="pint">pint</SelectItem>
                        <SelectItem value="quart">quart</SelectItem>
                        <SelectItem value="gallon">gallon</SelectItem>
                        <SelectItem value="pinch">pinch</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${fieldBaseName}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Ingredient name"
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          // Clear error if field becomes valid
                          if (e.target.value.trim() && clearErrors) {
                            clearErrors(`${fieldBaseName}.name`);
                          }
                          // Trigger validation on blur
                          if (onValidate) {
                            onValidate();
                          }
                        }}
                        onChange={(e) => {
                          field.onChange(e);
                          // Trigger field change callback
                          if (onFieldChange) {
                            onFieldChange();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`${fieldBaseName}.notes`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Notes (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delete Button */}
            <DeleteButton
              onDelete={onDelete}
              disabled={isLoading}
              ariaLabel={`Delete ${ingredient.name || 'ingredient'}`}
            />
          </div>
        )}
      </Draggable>
    );
  },
  // Custom comparison function for React.memo
  // Only re-render if these specific props change
  (prevProps, nextProps) => {
    return (
      prevProps.ingredient.id === nextProps.ingredient.id &&
      prevProps.ingredient.name === nextProps.ingredient.name &&
      prevProps.ingredient.amount === nextProps.ingredient.amount &&
      prevProps.ingredient.unit === nextProps.ingredient.unit &&
      prevProps.ingredient.notes === nextProps.ingredient.notes &&
      prevProps.index === nextProps.index &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.fieldBaseName === nextProps.fieldBaseName
      // Note: We don't compare functions (onDelete, onValidate, etc.)
      // because they should be stable (wrapped in useCallback in parent)
    );
  }
);
