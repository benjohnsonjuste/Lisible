// components/ui/Button.jsx
import React from "react";
import { cn } from "../../utils/cn";

/**
 * Button simple compatible import { Button } et import Button default
 * Supporte variant, size, fullWidth, asChild, loading, disabled.
 */

const base =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

const variantClasses = {
  default: "bg-primary text-white hover:bg-primary/90",
  outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeClasses = {
  xs: "h-8 px-2 text-xs",
  sm: "h-9 px-3",
  md: "h-10 px-4",
  lg: "h-11 px-6",
  xl: "h-12 px-8",
};

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "default",
    size = "md",
    fullWidth = false,
    asChild = false,
    loading = false,
    disabled = false,
    children,
    ...props
  },
  ref
) {
  const classes = cn(
    base,
    variantClasses[variant] ?? variantClasses.default,
    sizeClasses[size] ?? sizeClasses.md,
    fullWidth ? "w-full" : "",
    className
  );

  if (asChild) {
    try {
      const child = React.Children.only(children);
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
        ref,
        ...props,
      });
    } catch {
      return <button className={classes} ref={ref} {...props}>{children}</button>;
    }
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
      {loading ? "…" : children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };
export default Button;