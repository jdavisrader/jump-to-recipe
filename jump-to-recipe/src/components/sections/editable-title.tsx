'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EditableTitle({
  value,
  onChange,
  placeholder = 'Untitled Section',
  className,
  disabled = false
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
        className={cn(
          'bg-transparent border-none outline-none rounded px-1 py-0.5 transition-all duration-200',
          'animate-in fade-in-0 duration-200',
          'focus:section-focus-ring',
          disabled && 'opacity-50 cursor-not-allowed',
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
      className={cn(
        'text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 section-button',
        'focus:outline-none focus:section-focus-ring',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:scale-100',
        className
      )}
      title={disabled ? 'Editing disabled' : 'Click to edit'}
    >
      {displayValue}
    </button>
  );
}