"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/error-handling";

interface EditableFieldProps {
  label: string;
  value: string;
  type?: "text" | "email";
  disabled?: boolean;
  disabledReason?: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  validation?: (value: string) => string | null;
  className?: string;
}

export function EditableField({
  label,
  value,
  type = "text",
  disabled = false,
  disabledReason,
  onChange,
  onSave,
  onCancel,
  validation,
  className,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced validation function
  const validateDebounced = useCallback((value: string): void => {
    if (validation) {
      const validationError = validation(value);
      setError(validationError);
    }
  }, [validation]);

  const debouncedValidation = useMemo(
    () => debounce(validateDebounced as (...args: unknown[]) => unknown, 300),
    [validateDebounced]
  );

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

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setError(null);
  };

  const handleSave = () => {
    // Validate if validation function is provided
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Call onChange to update parent state
    onChange(editValue);
    
    // Call onSave if provided
    if (onSave) {
      onSave(editValue);
    }

    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(value); // Reset to original value
    setIsEditing(false);
    setError(null);
    
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setError(null); // Clear error when user starts typing
    
    // Trigger debounced validation
    if (validation && newValue.trim()) {
      debouncedValidation(newValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`editable-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {label}
      </Label>
      
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              id={`editable-${label.toLowerCase().replace(/\s+/g, '-')}`}
              type={type}
              value={editValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex-1",
                error && "border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${label}-error` : undefined}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              className="h-9 w-9 p-0"
              aria-label="Save changes"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-9 w-9 p-0"
              aria-label="Cancel changes"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <p id={`${label}-error`} className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <div className={cn(
            "flex-1 min-h-[2.5rem] flex items-center px-3 py-2 border rounded-md transition-colors",
            disabled 
              ? "border-input bg-muted/50 cursor-not-allowed" 
              : "border-input bg-background hover:bg-muted/30 cursor-pointer"
          )}
          onClick={!disabled ? handleEdit : undefined}
          >
            <span className={cn(
              "text-sm",
              disabled ? "text-muted-foreground" : "text-card-foreground"
            )}>
              {value || "Not set"}
            </span>
          </div>
          {!disabled && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              aria-label={`Edit ${label.toLowerCase()}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {disabled && disabledReason && (
        <p className="text-xs text-muted-foreground">
          {disabledReason}
        </p>
      )}
    </div>
  );
}