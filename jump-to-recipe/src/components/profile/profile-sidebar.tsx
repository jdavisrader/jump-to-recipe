'use client';

import Image from 'next/image';

interface ProfileSidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    image?: string | null;
  };
}

export function ProfileSidebar({ user }: ProfileSidebarProps) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm transition-colors">
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-primary/10 rounded-full flex items-center justify-center ring-4 ring-background shadow-lg">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={`${user.name}'s avatar`}
                  width={112}
                  height={112}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-card-foreground">
              {user.name}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base break-all">
              {user.email}
            </p>
          </div>
        </div>

        {/* User Metadata */}
        <div className="space-y-4 border-t border-border pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-muted-foreground">Role</span>
              <span className="text-sm font-semibold text-card-foreground capitalize bg-secondary/50 px-2 py-1 rounded-md">
                {user.role}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-muted-foreground">Member since</span>
              <span className="text-sm text-card-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-muted-foreground">Last updated</span>
              <span className="text-sm text-card-foreground">
                {new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}