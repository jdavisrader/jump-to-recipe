/**
 * Admin Cookbook Management Components
 * 
 * Export all admin cookbook management components for easy importing
 */

// Standalone components (RECOMMENDED for Server Components)
export { AdminCookbookManagementStandalone } from './admin-cookbook-management-standalone';
export { AdminOwnershipTransferStandalone } from './admin-ownership-transfer-standalone';
export { AdminCollaboratorManagerStandalone } from './admin-collaborator-manager-standalone';

// Wrapper components
export { AdminCookbookManagementServer } from './admin-cookbook-management-server';
export { AdminCookbookManagement } from './admin-cookbook-management';

// Direct components (for Client Components with custom callbacks)
export { AdminOwnershipTransfer } from './admin-ownership-transfer';
export { AdminCollaboratorManager } from './admin-collaborator-manager';