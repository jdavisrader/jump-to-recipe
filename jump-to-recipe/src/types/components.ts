// Component-specific TypeScript interfaces and types

import type { ReactNode } from 'react';
import type { 
  CookbookOption, 
  PendingOperation, 
  CookbookToggleHandler,
  ModalCloseHandler,
  CreateCookbookHandler 
} from './add-to-cookbook';

// Extended button component props (extends the base ones from add-to-cookbook)
export interface ExtendedAddToCookbookButtonProps {
  recipeId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: ReactNode;
}

// Extended modal component props (extends the base ones from add-to-cookbook)
export interface ExtendedAddToCookbookModalProps {
  recipeId: string;
  isOpen: boolean;
  onClose: ModalCloseHandler;
  className?: string;
  maxHeight?: string;
}

// Modal state interface
export interface AddToCookbookModalState {
  cookbooks: CookbookOption[];
  searchQuery: string;
  isInitialLoading: boolean;
  pendingOperations: Map<string, PendingOperation>;
  retryAttempts: Map<string, number>;
}

// Modal handlers interface
export interface AddToCookbookModalHandlers {
  handleCookbookToggle: CookbookToggleHandler;
  handleCreateCookbook: CreateCookbookHandler;
  handleClose: ModalCloseHandler;
  handleSearchChange: (query: string) => void;
}

// Cookbook list item props
export interface CookbookListItemProps {
  cookbook: CookbookOption;
  isPending: boolean;
  retryCount: number;
  onToggle: (cookbookId: string, isChecked: boolean) => void;
  pendingOperation?: PendingOperation;
}

// Search input props
export interface CookbookSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Empty state props
export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: ReactNode;
}

// Loading state props
export interface LoadingStateProps {
  message?: string;
  className?: string;
}

// Error state props
export interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

// Modal header props
export interface ModalHeaderProps {
  title: string;
  pendingCount: number;
  onClose: ModalCloseHandler;
  canClose: boolean;
}

// Modal footer props
export interface ModalFooterProps {
  onCreateCookbook: CreateCookbookHandler;
  createButtonLabel?: string;
  disabled?: boolean;
}

// Recipe display integration props
export interface RecipeDisplayProps {
  recipe: {
    id: string;
    title: string;
    imageUrl?: string | null;
    sourceUrl?: string | null;
    // ... other recipe properties
  };
  showAddToCookbook?: boolean;
  className?: string;
}

// Toast notification props
export interface ToastProps {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Checkbox with loading state props
export interface LoadingCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

// Operation status indicator props
export interface OperationStatusProps {
  operation: 'add' | 'remove';
  isLoading: boolean;
  retryCount?: number;
  className?: string;
}

// Cookbook permission badge props
export interface PermissionBadgeProps {
  permission: 'edit' | 'owner';
  isOwned: boolean;
  className?: string;
}

// Responsive modal props
export interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  className?: string;
  maxWidth?: string;
  fullScreenOnMobile?: boolean;
}

// Keyboard navigation props
export interface KeyboardNavigationProps {
  onEscape: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  disabled?: boolean;
}

// Accessibility props
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
  tabIndex?: number;
}

// Animation props
export interface AnimationProps {
  animate?: boolean;
  duration?: number;
  easing?: string;
  delay?: number;
}

// Theme props
export interface ThemeProps {
  theme?: 'light' | 'dark' | 'system';
  className?: string;
}

// Responsive breakpoint props
export interface ResponsiveProps {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  className?: string;
}

// Form validation props
export interface ValidationProps {
  isValid?: boolean;
  errors?: string[];
  touched?: boolean;
  className?: string;
}

// Performance optimization props
export interface PerformanceProps {
  lazy?: boolean;
  preload?: boolean;
  priority?: boolean;
  className?: string;
}