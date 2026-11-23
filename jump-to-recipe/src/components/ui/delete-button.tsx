import * as React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

/**
 * Props for the DeleteButton component.
 */
export interface DeleteButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Callback function when the delete button is clicked.
   */
  onDelete?: () => void;
  
  /**
   * Accessible label for screen readers.
   * Should describe what will be deleted (e.g., "Delete ingredient").
   */
  ariaLabel?: string;
  
  /**
   * Size variant for the button.
   * Defaults to "sm" for compact display in lists.
   */
  size?: "default" | "sm" | "lg" | "icon";
  
  /**
   * Visual variant for the button.
   * Defaults to "ghost" so it matches the section delete button.
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

/**
 * DeleteButton - A button component for deleting items with clear visual feedback.
 * 
 * This component displays a trash icon that users can click to delete items.
 * It includes proper accessibility labels, hover states, and follows the
 * design system's button patterns.
 * 
 * ## Features
 * 
 * - **Visual Indicator**: Trash icon from lucide-react
 * - **Hover State**: Visual feedback on hover
 * - **Accessibility**: Proper ARIA labels and keyboard support
 * - **Disabled State**: Visual feedback when deletion is not allowed
 * - **Variants**: Supports all button variants from the design system
 * - **Performance**: Memoized to prevent unnecessary re-renders
 * 
 * ## Accessibility
 * 
 * - Uses semantic `<button>` element
 * - Includes `aria-label` for screen reader support
 * - Supports keyboard navigation (Enter/Space)
 * - Provides visual focus indicators
 * - Announces button purpose to screen readers
 * 
 * ## Usage
 * 
 * ### Basic Usage
 * 
 * @example
 * ```tsx
 * <DeleteButton 
 *   onDelete={() => handleDelete(id)}
 *   ariaLabel="Delete ingredient"
 * />
 * ```
 * 
 * ### With Destructive Variant
 * 
 * @example
 * ```tsx
 * <DeleteButton 
 *   variant="destructive"
 *   onDelete={() => handleDelete(id)}
 *   ariaLabel="Delete recipe"
 * />
 * ```
 * 
 * ### With Disabled State
 * 
 * @example
 * ```tsx
 * <DeleteButton 
 *   disabled={isLastItem}
 *   onDelete={() => handleDelete(id)}
 *   ariaLabel="Delete ingredient"
 * />
 * ```
 * 
 * ### In a List Item
 * 
 * @example
 * ```tsx
 * <div className="flex gap-2 items-start">
 *   <DragHandle ariaLabel="Drag to reorder" />
 *   <Input placeholder="Item name" />
 *   <DeleteButton 
 *     onDelete={() => removeItem(id)}
 *     ariaLabel={`Delete ${itemName}`}
 *   />
 * </div>
 * ```
 * 
 * ## Styling
 * 
 * The component uses the Button component from the design system:
 * 
 * - **Default**: Ghost variant with a muted icon
 * - **Hover**: Background color change and icon color change
 * - **Focus**: Ring indicator for keyboard navigation
 * - **Disabled**: Muted appearance and not-allowed cursor
 * - **Dark Mode**: Appropriate colors for dark theme
 * 
 * ## Variants
 * 
 * - **ghost** (default): No background, muted icon that turns red on hover
 * - **outline**: Subtle border with hover effect
 * - **destructive**: Red background for dangerous actions
 * - **secondary**: Secondary color scheme
 * 
 * ## Requirements
 * 
 * Validates Requirements 4.1, 4.4, 8.5:
 * - 4.1: Displays a clear delete (trash) icon
 * - 4.4: Provides visual feedback on hover
 * - 8.5: Memoized to avoid unnecessary re-renders
 * 
 * @param props - Component props
 * @returns A delete button component
 */
export const DeleteButton = React.memo(function DeleteButton({
  onDelete,
  ariaLabel = "Delete",
  size = "icon",
  variant = "ghost",
  disabled = false,
  className,
  onClick,
  ...props
}: DeleteButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (onDelete && !disabled) {
      onDelete();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        // Muted until hover, matching the section delete button
        "text-muted-foreground hover:text-destructive",
        className
      )}
      {...props}
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
});
