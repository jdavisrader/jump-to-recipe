"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { EditableField } from "./editable-field";
import { ReadOnlyField } from "./read-only-field";
import { PasswordChangeModal } from "./password-change-modal";
import { Loader2, Key } from "lucide-react";
import { 
  apiRequest, 
  retryRequest, 
  handleApiError, 
  ValidationError, 
  AuthenticationError 
} from "@/lib/error-handling";

// Validation schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  authProvider: 'credentials' | 'google';
}

interface ProfileFormProps {
  initialData: ProfileData;
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const {
    setValue,
    getValues,
    formState: { errors },
    trigger,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
      email: initialData.email,
    },
  });

  // Track if form has changes
  const checkForChanges = (name: keyof ProfileFormData, value: string) => {
    const currentValues = getValues();
    const updatedValues = { ...currentValues, [name]: value };
    const hasFormChanges = 
      updatedValues.name !== initialData.name || 
      updatedValues.email !== initialData.email;
    setHasChanges(hasFormChanges);
  };

  const handleFieldChange = (field: keyof ProfileFormData, value: string) => {
    setValue(field, value);
    checkForChanges(field, value);
  };

  const validateField = (field: keyof ProfileFormData) => {
    return (value: string) => {
      try {
        if (field === 'name') {
          profileSchema.shape.name.parse(value);
        } else if (field === 'email') {
          profileSchema.shape.email.parse(value);
        }
        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.issues[0]?.message || "Invalid value";
        }
        return "Invalid value";
      }
    };
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isValid = await trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = getValues();
      
      // Use retry logic for network requests
      await retryRequest(async () => {
        return await apiRequest('/api/user/profile', {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      });

      toast({
        title: "Profile updated successfully",
        description: "Your profile has been updated successfully.",
      });

      // Reset form state
      setHasChanges(false);
      
      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Handle authentication errors with redirect
        handleApiError(error, 'profile update');
        return;
      }

      if (error instanceof ValidationError) {
        // Handle field-specific validation errors
        if (error.field === 'email') {
          toast({
            title: "Email Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Validation Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Handle other errors with generic error handler
      handleApiError(error as Error, 'profile update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGoogleUser = initialData.authProvider === 'google';

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-card-foreground">
          Profile Information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Update your personal information and account settings.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Editable Fields Section */}
        <div className="space-y-6">
          <EditableField
            label="Name"
            value={getValues('name')}
            type="text"
            onChange={(value) => handleFieldChange('name', value)}
            validation={validateField('name')}
          />

          <EditableField
            label="Email"
            value={getValues('email')}
            type="email"
            disabled={isGoogleUser}
            disabledReason={isGoogleUser ? "Email cannot be changed for Google-authenticated users" : undefined}
            onChange={(value) => handleFieldChange('email', value)}
            validation={validateField('email')}
          />
        </div>

        {/* Read-only fields */}
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Account Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField
              label="Role"
              value={initialData.role}
              type="text"
            />

            <ReadOnlyField
              label="Last Updated"
              value={initialData.updatedAt}
              type="datetime"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!hasChanges || isSubmitting}
              className="flex-1 sm:flex-none sm:min-w-[140px] transition-all"
              size="default"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>

            {!isGoogleUser && (
              <Button
                variant="outline"
                className="flex-1 sm:flex-none sm:min-w-[140px] transition-all"
                onClick={() => setIsPasswordModalOpen(true)}
                size="default"
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            )}
          </div>
          
          {isGoogleUser && (
            <p className="text-xs text-muted-foreground mt-3 bg-muted/30 p-3 rounded-md">
              <strong>Note:</strong> Some settings are limited for Google-authenticated accounts. 
              Password changes must be done through your Google account.
            </p>
          )}
        </div>

        {/* Display validation errors */}
        {(errors.name || errors.email) && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-1">
            {errors.name && (
              <p className="text-sm text-destructive font-medium">{errors.name.message}</p>
            )}
            {errors.email && (
              <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
            )}
          </div>
        )}

        {/* Password Change Modal */}
        <PasswordChangeModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </CardContent>
    </Card>
  );
}