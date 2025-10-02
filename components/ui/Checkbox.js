// components/ui/Checkbox.jsx
import React, { forwardRef, useId } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "../../utils/cn";

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const Checkbox = forwardRef(
  (
    {
      id,
      checked = false,
      indeterminate = false,
      disabled = false,
      required = false,
      label,
      description,
      error,
      size = "md",
      className,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${useId()}`;

    return (
      <div className={cn("flex flex-col space-y-1", className)}>
        <div className="flex items-center space-x-2">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            checked={checked}
            disabled={disabled}
            required={required}
            className={cn(
              "rounded border-primary text-primary focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
              sizeClasses[size]
            )}
            {...props}
          />
          {indeterminate && !checked && (
            <Minus
              className={cn(
                "absolute pointer-events-none",
                sizeClasses[size]
              )}
            />
          )}
          {checked && (
            <Check
              className={cn(
                "absolute pointer-events-none",
                sizeClasses[size]
              )}
            />
          )}
          {label && (
            <label htmlFor={checkboxId} className="text-sm font-medium">
              {label}
            </label>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;

// Optionnel : groupe de cases à cocher
export const CheckboxGroup = forwardRef(
  ({ children, className, ...props }, ref) => {
    return (
      <fieldset ref={ref} className={cn("space-y-3", className)} {...props}>
        {children}
      </fieldset>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";