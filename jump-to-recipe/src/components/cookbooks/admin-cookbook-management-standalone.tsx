'use client';

import { AdminOwnershipTransferStandalone } from './admin-ownership-transfer-standalone';
import { AdminCollaboratorManagerStandalone } from './admin-collaborator-manager-standalone';
import type { CookbookWithMetadata, CollaboratorWithUser } from '@/types/admin-cookbook';

interface AdminCookbookManagementStandaloneProps {
  cookbook: CookbookWithMetadata;
  collaborators: CollaboratorWithUser[];
}

/**
 * Standalone admin cookbook management component
 * This component is completely self-contained and safe to use in Server Components
 * No function props required - handles everything internally
 */
export function AdminCookbookManagementStandalone({ 
  cookbook, 
  collaborators 
}: AdminCookbookManagementStandaloneProps) {
  return (
    <div className="space-y-6">
      <AdminOwnershipTransferStandalone
        cookbookId={cookbook.id}
        currentOwner={cookbook.owner}
      />
      
      <AdminCollaboratorManagerStandalone
        cookbookId={cookbook.id}
        collaborators={collaborators}
      />
    </div>
  );
}