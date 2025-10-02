import React from "react";

/**
 * Composant image avec fallback automatique
 *
 * @param {string} src - Source de l’image
 * @param {string} alt - Texte alternatif (par défaut "Image")
 * @param {string} className - Classes CSS optionnelles
 */
export default function AppImage({
  src,
  alt = "Image",
  className = "",
  ...props
}) {
  const handleError = (e) => {
    // si l'image échoue, on charge une image par défaut
    e.target.src = "/assets/images/no_image.png";
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}