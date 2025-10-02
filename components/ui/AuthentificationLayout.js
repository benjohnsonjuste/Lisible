// components/ui/AuthenticationLayout.jsx
import React from "react";
import AppIcon from "@/components/AppIcon";
import InstallPrompt from "@/components/ui/InstallPrompt";

export default function AuthenticationLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 relative">
      
      {/* Motif SVG en arrière-plan */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Cpath fill=%22none%22 stroke=%22%23000000%22 d=%22M0 0L100 100%22/%3E%3C/svg%3E')] bg-repeat"></div>

      {/* Conteneur principal */}
      <div className="relative w-full max-w-md bg-white shadow-lg rounded-2xl p-8 flex flex-col items-center">
        
        {/* Logo / Icône de l'application */}
        <div className="inline-flex justify-center items-center w-16 h-16 bg-primary rounded-2xl shadow-md mb-4">
          <AppIcon size={32} color="var(--color-primary)" />
        </div>

        {/* Titre et sous-titre */}
        {title && <h1 className="text-center text-2xl font-semibold text-gray-900 mb-2">{title}</h1>}
        {subtitle && <p className="text-center text-gray-600 mb-6">{subtitle}</p>}

        {/* Contenu de la page d'authentification */}
        <div className="w-full">{children}</div>
      </div>

      {/* InstallPrompt intégré */}
      <InstallPrompt variant="button" />

    </div>
  );
}