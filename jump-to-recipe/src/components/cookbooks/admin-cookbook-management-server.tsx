import { AdminCookbookManagement } from './admin-cookbook-management';
import type { CookbookWithMetadata, CollaboratorWithUser } from '@/types/admin-cookbook';

interface AdminCookbookManagementServerProps {
  cookbook: CookbookWithMetadata;
  collaborators: CollaboratorWithUser[];
}

/**
 * Server component wrapper for admin cookbook management
 * This component can be safely used in Server Components
 */
export function AdminCookbookManagementServer({ 
  cookbook, 
  collaborators 
}: AdminCookbookManagementServerProps) {
  return (
    <AdminCookbookManagement 
      cookbook={cookbook} 
      collaborators={collaborators} 
    />
  );
}