'use client';

import { ReactNode } from 'react';

interface ProfileLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function ProfileLayout({ children, sidebar }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Your Profile
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your account settings and personal information.
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Profile Sidebar - Full width on mobile, 4 columns on desktop */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-6">
              {sidebar}
            </div>
          </div>

          {/* Main Content - Full width on mobile, 8 columns on desktop */}
          <div className="lg:col-span-8 xl:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}