'use client';

import { useState, useCallback } from 'react';
import { AdminOwnershipTransfer } from './admin-ownership-transfer';
import { AdminCollaboratorManager } from './admin-collaborator-manager';
import type { CookbookWithMetadata, CollaboratorWithUser } from '@/types/admin-cookbook';

interface AdminCookbookManagementProps {
  cookbook: CookbookWithMetadata;
  collaborators: CollaboratorWithUser[];
}

/**
 * Client component wrapper for admin cookbook management
 * This component handles the client-server boundary properly
 */
export function AdminCookbookManagement({ 
  cookbook, 
  collaborators: initialCollaborators 
}: AdminCookbookManagementProps) {
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [currentOwner, setCurrentOwner] = useState(cookbook.owner);

  // Handle ownership transfer
  const handleOwnershipTransfer = useCallback((newOwnerId: string) => {
    // Refresh the page or update state as needed
    window.location.reload();
  }, []);

  // Handle collaborator updates
  const handleCollaboratorUpdate = useCallback(async () => {
    try {
      // Fetch updated collaborators
      const response = await fetch(`/api/admin/cookbooks/${cookbook.id}/collaborators`);
      if (response.ok) {
        const updatedCollaborators = await response.json();
        setCollaborators(updatedCollaborators);
      }
    } catch (error) {
      console.error('Failed to refresh collaborators:', error);
    }
  }, [cookbook.id]);

  return (
    <div className="space-y-6">
      <AdminOwnershipTransfer
        cookbookId={cookbook.id}
        currentOwner={currentOwner}
        onTransfer={handleOwnershipTransfer}
      />
      
      <AdminCollaboratorManager
        cookbookId={cookbook.id}
        collaborators={collaborators}
        onUpdate={handleCollaboratorUpdate}
      />
    </div>
  );
}