// components/ui/AuthenticationLayout.jsx
import React from "react";
import AppIcon from "@/components/AppIcon";
import InstallPrompt from "@/components/ui/InstallPrompt";

export default function AuthenticationLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 relative">

      {/* Carte d’authentification */}
      <div className="bg-card rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        
        {/* Logo / Icône */}
        <div className="inline-flex justify-center items-center w-16 h-16 bg-primary rounded-2xl shadow-md mb-4">
          <AppIcon size={32} color="var(--color-primary)" />
        </div>

        {/* Titre et sous-titre */}
        {title && (
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 mb-6 text-center rounded">
            {subtitle}
          </p>
        )}

        {/* Contenu des formulaires d’authentification */}
        <div className="w-full">{children}</div>
      </div>

      {/* Pied de page */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-500 font-legend">
          © 2025 Lisible. Tous droits réservés.
        </p>
      </div>

      {/* Composant InstallPrompt pour PWA */}
      <InstallPrompt variant="button" />
    </div>
  );
}