// components/ui/Button.jsx
import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../utils/cn";
import LoadingSpinner from "./LoadingSpinner";
import AppIcon from "../AppIcon";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
        danger: "bg-error text-error-foreground hover:bg-error/90",
      },
      size: {
        xs: "h-8 px-2 text-xs",
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-11 px-6",
        xl: "h-12 px-8",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
    },
  }
);

const iconSizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
};

const Button = forwardRef(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      children,
      asChild = false,
      iconName = null,
      iconPosition = "left",
      iconSize = null,
      loading = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const calculatedIconSize = iconSize || iconSizeMap[size] || 20;

    const renderIcon = () =>
      iconName ? (
        <AppIcon
          name={iconName}
          size={calculatedIconSize}
          className={iconPosition === "left" ? "mr-2" : "ml-2"}
        />
      ) : null;

    const content = (
      <>
        {loading && <LoadingSpinner className="mr-2" />}
        {iconName && iconPosition === "left" && renderIcon()}
        {children}
        {iconName && iconPosition === "right" && renderIcon()}
      </>
    );

    if (asChild) {
      try {
        const child = React.Children.only(children);
        if (!React.isValidElement(child)) return content;
        return React.cloneElement(child, {
          className: cn(buttonVariants({ variant, size, fullWidth }), child.props.className),
          ...props,
        });
      } catch {
        return content;
      }
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export default Button;