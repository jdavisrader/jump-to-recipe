import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import {
  strictRecipeWithSectionsSchema,
  type StrictValidationError,
} from '@/lib/validations/recipe-sections';

/**
 * Validation error with field path and message
 */
export interface ValidationError {
  path: string[];
  message: string;
}

/**
 * Validation state containing errors and validity status
 */
export interface ValidationState {
  errors: ValidationError[];
  isValid: boolean;
  errorsByField: Map<string, string>;
}

/**
 * Error summary with count and unique error types
 */
export interface ErrorSummary {
  count: number;
  types: string[];
}

/**
 * Return type for the useRecipeValidation hook
 */
export interface UseRecipeValidationReturn {
  validate: (data: unknown) => boolean;
  getFieldError: (fieldPath: string) => string | undefined;
  isValid: boolean;
  errors: ValidationError[];
  errorSummary: ErrorSummary | null;
  clearErrors: () => void;
}

/**
 * Custom hook for client-side recipe validation with strict rules.
 * 
 * Provides validation state management, field-level error retrieval,
 * and error summary computation with performance optimizations.
 * 
 * @example
 * ```tsx
 * const { validate, getFieldError, isValid, errorSummary } = useRecipeValidation();
 * 
 * const handleSubmit = (data) => {
 *   if (!validate(data)) {
 *     console.log('Validation failed:', errorSummary);
 *     return;
 *   }
 *   // Proceed with save
 * };
 * 
 * const nameError = getFieldError('ingredientSections.0.name');
 * ```
 * 
 * Requirements addressed:
 * - 1.1, 1.2, 1.3, 1.4, 1.5: Section name validation
 * - 5.1, 5.2, 5.3, 5.4, 5.5: Inline validation feedback
 * - 14.1, 14.2, 14.3, 14.4, 14.5: Validation error summary
 */
export function useRecipeValidation(): UseRecipeValidationReturn {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: [],
    isValid: true,
    errorsByField: new Map(),
  });

  /**
   * Validates recipe data against strict schema.
   * 
   * @param data - Recipe data to validate
   * @returns True if validation passes, false otherwise
   * 
   * Requirements:
   * - 1.1: Validates section names are non-empty
   * - 1.2: Validates section names on save attempt
   * - 1.3: Validates section names don't contain only whitespace
   * - 2.1: Validates sections contain at least one item
   * - 3.1: Validates at least one ingredient exists
   */
  const validate = useCallback((data: unknown): boolean => {
    const result = strictRecipeWithSectionsSchema.safeParse(data);

    if (result.success) {
      setValidationState({
        errors: [],
        isValid: true,
        errorsByField: new Map(),
      });
      return true;
    }

    // Convert Zod errors to structured format
    const errors: ValidationError[] = result.error.issues.map(issue => ({
      path: issue.path.map(String),
      message: issue.message,
    }));

    // Create field-level error map for quick lookups
    const errorsByField = new Map<string, string>();
    errors.forEach(error => {
      const key = error.path.join('.');
      // Store first error for each field (Zod may report multiple)
      if (!errorsByField.has(key)) {
        errorsByField.set(key, error.message);
      }
    });

    setValidationState({
      errors,
      isValid: false,
      errorsByField,
    });

    return false;
  }, []);

  /**
   * Retrieves validation error for a specific field path.
   * 
   * @param fieldPath - Dot-separated field path (e.g., 'ingredientSections.0.name')
   * @returns Error message if exists, undefined otherwise
   * 
   * Requirements:
   * - 5.1: Provides inline error messages near invalid fields
   * - 5.2: Supports multiple simultaneous errors
   */
  const getFieldError = useCallback(
    (fieldPath: string): string | undefined => {
      return validationState.errorsByField.get(fieldPath);
    },
    [validationState.errorsByField]
  );

  /**
   * Clears all validation errors and resets to valid state.
   * Useful when user wants to dismiss errors or start fresh.
   */
  const clearErrors = useCallback(() => {
    setValidationState({
      errors: [],
      isValid: true,
      errorsByField: new Map(),
    });
  }, []);

  /**
   * Computes error summary with count and unique error types.
   * Memoized for performance - only recomputes when errors change.
   * 
   * Requirements:
   * - 14.1: Provides summary message at top of form
   * - 14.2: Lists number of errors
   * - 14.3: Includes list of all error types
   * - 14.4: Updates immediately when errors change
   * - 14.5: Disappears when all errors are fixed
   */
  const errorSummary = useMemo((): ErrorSummary | null => {
    if (validationState.errors.length === 0) {
      return null;
    }

    // Extract unique error messages (types)
    const errorTypes = new Set<string>();
    validationState.errors.forEach(error => {
      errorTypes.add(error.message);
    });

    const uniqueTypes = Array.from(errorTypes);

    return {
      count: uniqueTypes.length, // Use count of unique error types, not total errors
      types: uniqueTypes,
    };
  }, [validationState.errors]);

  return {
    validate,
    getFieldError,
    isValid: validationState.isValid,
    errors: validationState.errors,
    errorSummary,
    clearErrors,
  };
}

/**
 * Type guard to check if data has validation errors
 */
export function hasValidationErrors(
  result: { isValid: boolean; errors: ValidationError[] }
): result is { isValid: false; errors: ValidationError[] } {
  return !result.isValid && result.errors.length > 0;
}

/**
 * Formats validation errors for display in UI
 * 
 * @param errors - Array of validation errors
 * @returns Formatted error messages grouped by field
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  errors.forEach(error => {
    const key = error.path.join('.');
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(error.message);
  });

  return grouped;
}

/**
 * Gets the first error message for a field path from an array of errors
 * 
 * @param errors - Array of validation errors
 * @param fieldPath - Dot-separated field path
 * @returns First error message for the field, or undefined
 */
export function getFirstFieldError(
  errors: ValidationError[],
  fieldPath: string
): string | undefined {
  const error = errors.find(e => e.path.join('.') === fieldPath);
  return error?.message;
}
