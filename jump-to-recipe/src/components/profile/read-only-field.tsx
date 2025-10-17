"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ReadOnlyFieldProps {
  label: string;
  value: string | number | Date;
  type?: "text" | "date" | "datetime" | "number";
  className?: string;
  valueClassName?: string;
  formatter?: (value: string | number | Date) => string;
}

export function ReadOnlyField({
  label,
  value,
  type = "text",
  className,
  valueClassName,
  formatter,
}: ReadOnlyFieldProps) {
  const formatValue = (val: string | number | Date): string => {
    if (formatter) {
      return formatter(val);
    }

    if (type === "date" && val instanceof Date) {
      return val.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    if (type === "datetime" && val instanceof Date) {
      return val.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (type === "datetime" && typeof val === "string") {
      const date = new Date(val);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (type === "number" && typeof val === "number") {
      return val.toLocaleString();
    }

    if (type === "text" && typeof val === "string") {
      return val.charAt(0).toUpperCase() + val.slice(1);
    }

    return String(val);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={`readonly-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {label}
      </Label>
      <div 
        id={`readonly-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className="min-h-[2.5rem] flex items-center px-3 py-2 border border-input bg-muted/50 rounded-md transition-colors"
      >
        <span className={cn(
          "text-sm text-card-foreground",
          type === "text" && "font-medium capitalize",
          valueClassName
        )}>
          {formatValue(value)}
        </span>
      </div>
    </div>
  );
}