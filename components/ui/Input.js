// components/ui/Input.jsx
import React from "react";
import { cn } from "../../utils/cn";

const Input = React.forwardRef(
  (
    {
      id,
      label,
      description,
      error,
      type = "text",
      required = false,
      className,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-primary">
            {label} {required && <span className="text-destructive">*</span>}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          type={type}
          required={required}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            type === "checkbox" || type === "radio"
              ? "h-4 w-4"
              : "",
            error && "border-destructive focus:ring-destructive"
          )}
          {...props}
        />

        {description && !error && (
          <p className="text-xs text-muted">{description}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;