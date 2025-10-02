import React from "react";
import * as LucideIcons from "lucide-react";

/**
 * Composant générique pour afficher une icône Lucide
 *
 * @param {string} name - Nom de l’icône (par ex. "Rocket", "Bell")
 * @param {number} size - Taille de l’icône (par défaut 24)
 * @param {string} color - Couleur de l’icône (par défaut "currentColor")
 * @param {number} strokeWidth - Largeur du trait (par défaut 2)
 * @param {string} className - Classes CSS additionnelles
 */
export default function AppIcon({
  name,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className = "",
  ...props
}) {
  const IconComponent = LucideIcons[name];

  if (!IconComponent) {
    return (
      <LucideIcons.HelpCircle
        size={size}
        color="red"
        strokeWidth={strokeWidth}
        className={`inline-block ${className}`}
        {...props}
      />
    );
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={`inline-block ${className}`}
      {...props}
    />
  );
}