"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Camera, User } from "lucide-react";

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
  userName?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarUpload({
  value,
  onChange,
  onRemove,
  disabled,
  userName = "User",
  size = "md",
}: AvatarUploadProps) {
  const [isEditing, setIsEditing] = useState(false);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={value} />
            <AvatarFallback>
              <User className="h-1/2 w-1/2" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">Profile Picture</h3>
            <p className="text-sm text-gray-500">
              Upload a photo to personalize your profile
            </p>
          </div>
        </div>
        
        <ImageUpload
          category="avatars"
          value={value}
          onChange={(url) => {
            onChange(url);
            setIsEditing(false);
          }}
          onRemove={() => {
            onRemove?.();
            setIsEditing(false);
          }}
          disabled={disabled}
          placeholder="Upload your profile picture"
          className="aspect-square max-w-xs"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsEditing(false)}
          disabled={disabled}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={value} />
          <AvatarFallback className="bg-gray-100 text-gray-600">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
          disabled={disabled}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>
      
      <div>
        <h3 className="font-medium">Profile Picture</h3>
        <p className="text-sm text-gray-500">
          Click the camera icon to update your photo
        </p>
      </div>
    </div>
  );
}