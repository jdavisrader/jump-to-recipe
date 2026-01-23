'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the EditableTitle component.
 */
interface EditableTitleProps {
  /** Current value of the title */
  value: string;
  /** Callback when the title is changed */
  onChange: (value: string) => void;
  /** Placeholder text when the title is empty */
  placeholder?: string;
  /** Additional CSS classes for the title */
  className?: string;
  /** Whether editing is disabled */
  disabled?: boolean;
  /** ID for the element (for aria-labelledby) */
  id?: string;
  /** Whether the field has a validation error */
  'aria-invalid'?: boolean;
  /** ID of the element describing this field */
  'aria-describedby'?: string;
}

/**
 * EditableTitle - An inline editable text field for section titles.
 * 
 * This component provides a seamless inline editing experience:
 * - Click to edit the title
 * - Press Enter to save changes
 * - Press Escape to cancel editing
 * - Click outside to save changes
 * - Falls back to placeholder if empty
 * 
 * @example
 * ```tsx
 * <EditableTitle
 *   value={section.name}
 *   onChange={(newName) => handleRename(section.id, newName)}
 *   placeholder="Untitled Section"
 * />
 * ```
 */
export function EditableTitle({
  value,
  onChange,
  placeholder = 'Untitled Section',
  className,
  disabled = false,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop value changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    const finalValue = trimmedValue || placeholder;
    onChange(finalValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const displayValue = value || placeholder;

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn(
          'bg-transparent border-none outline-none rounded px-1 py-0.5 transition-all duration-200',
          'animate-in fade-in-0 duration-200',
          'focus:section-focus-ring',
          disabled && 'opacity-50 cursor-not-allowed',
          ariaInvalid && 'border-red-500 focus:ring-red-500',
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      id={id}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedby}
      className={cn(
        'text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 section-button',
        'focus:outline-none focus:section-focus-ring',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:scale-100',
        ariaInvalid && 'border border-red-500',
        className
      )}
      title={disabled ? 'Editing disabled' : 'Click to edit'}
      aria-label={`Section name: ${displayValue}. Click to edit.`}
    >
      {displayValue}
    </button>
  );
}