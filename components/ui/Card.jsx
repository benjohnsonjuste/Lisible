"use client";

import React from "react";
import clsx from "clsx";

/**
 * Composant Card réutilisable
 * Sert de conteneur stylisé pour afficher du contenu (texte, image, etc.)
 */
export function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Variante optionnelle : contenu interne de la carte
 */
export function CardContent({ children, className }) {
  return <div className={clsx("p-4", className)}>{children}</div>;
}