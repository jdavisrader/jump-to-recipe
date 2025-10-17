"use client";

import { ProfileErrorBoundary } from "./profile-error-boundary";

interface ProfilePageWrapperProps {
  children: React.ReactNode;
}

export function ProfilePageWrapper({ children }: ProfilePageWrapperProps) {
  return (
    <ProfileErrorBoundary>
      {children}
    </ProfileErrorBoundary>
  );
}