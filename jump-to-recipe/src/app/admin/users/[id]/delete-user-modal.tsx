"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { UserWithCounts, TransferCandidatesResponse } from "@/types/admin";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithCounts;
  onSuccess?: () => void;
}

export function DeleteUserModal({ isOpen, onClose, user, onSuccess }: DeleteUserModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  const [transferCandidates, setTransferCandidates] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  // Fetch transfer candidates when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTransferCandidates();
      
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Focus the delete button when modal opens
      const timer = setTimeout(() => {
        if (deleteButtonRef.current) {
          deleteButtonRef.current.focus();
        }
      }, 100);

      // Handle keyboard navigation
      const handleKeyDown = (event: KeyboardEvent) => {
        // Close modal on Escape key
        if (event.key === 'Escape' && !isDeleting) {
          event.preventDefault();
          onClose();
          return;
        }

        // Trap focus within modal
        if (event.key === 'Tab') {
          const modal = modalRef.current;
          if (!modal) return;

          const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey) {
            // Shift + Tab: focus previous element
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab: focus next element
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus to previously focused element when modal closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
      
      // Reset state when modal closes
      setSelectedOwnerId("");
      setValidationError("");
      setTransferCandidates([]);
    }
  }, [isOpen, onClose, isDeleting]);

  const fetchTransferCandidates = async () => {
    setIsLoadingCandidates(true);
    try {
      const response = await fetch(`/api/admin/users/transfer-candidates?excludeUserId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transfer candidates');
      }

      const data: TransferCandidatesResponse = await response.json();
      setTransferCandidates(data.users);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load transfer candidates',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleDelete = async () => {
    // Validate that new owner is selected
    if (!selectedOwnerId) {
      setValidationError('Please select a user to transfer ownership to');
      return;
    }

    setValidationError("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOwnerId: selectedOwnerId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      toast({
        title: 'Success',
        description: `User ${user.name} has been deleted and ownership transferred successfully`,
      });

      // Call success callback if provided (for list refresh)
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to user list if no callback (from detail page)
        router.push('/admin/users');
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={(e) => {
        // Close modal when clicking backdrop (but not when deleting)
        if (e.target === e.currentTarget && !isDeleting) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-background rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <h2 id="modal-title" className="text-lg font-semibold">
              Delete User
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isDeleting}
            className="h-8 w-8"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div id="modal-description" className="space-y-2">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{user.name}</strong>?
            </p>
            <p className="text-sm text-destructive font-medium">
              ⚠️ This action is irreversible.
            </p>
            <p className="text-sm text-muted-foreground">
              All recipes ({user.recipeCount}) and cookbooks ({user.cookbookCount}) owned by this user will be transferred to the selected user.
            </p>
          </div>

          {/* Transfer Ownership Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="new-owner">Transfer content to *</Label>
            <Select
              value={selectedOwnerId}
              onValueChange={(value) => {
                setSelectedOwnerId(value);
                setValidationError("");
              }}
              disabled={isLoadingCandidates || isDeleting}
            >
              <SelectTrigger id="new-owner" className={validationError ? "border-destructive" : ""}>
                <SelectValue placeholder={isLoadingCandidates ? "Loading users..." : "Select user"} />
              </SelectTrigger>
              <SelectContent>
                {transferCandidates.length === 0 && !isLoadingCandidates ? (
                  <div className="p-2 text-sm text-muted-foreground">No other users available</div>
                ) : (
                  transferCandidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name} ({candidate.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              ref={deleteButtonRef}
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isLoadingCandidates}
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
