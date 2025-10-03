import React from "react";

export default function AppIcon({ src, alt = "App Icon", className = "" }) {
  return (
    <img
      src={src || "/public/logo.png"}
      alt={alt}
      className={`w-10 h-10 object-contain ${className}`}
      onError={(e) => {
        e.target.src = "/public/logo.png";
      }}
    />
  );
}
