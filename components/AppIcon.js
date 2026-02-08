// components/AppIcon.jsx
"use client";

import React from "react";

/**
 * Barrel qui réexporte quelques icônes courantes depuis lucide-react,
 * + default export : AppIcon (simple fallback image/svg).
 */
export {
  PenTool,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  BookOpen,
  BarChart3,
  User,
  HelpCircle,
  LogOut,
  Plus,
} from "lucide-react";

export default function AppIcon({ src, alt = "icon", className, size = 24, ...props }) {
  if (src) {
    return (
      // simple image logo
      <img 
        src={src} 
        alt={alt} 
        width={size} 
        height={size} 
        className={className} 
        {...props} 
      />
    );
  }

  // fallback SVG (simple book-like icon)
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 5v14a1 1 0 0 0 1 1h15" />
      <path d="M21 5v14a1 1 0 0 0-1 1H6" />
      <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
    </svg>
  );
}
