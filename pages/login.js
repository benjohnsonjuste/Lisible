// pages/login/index.js
"use client";
export const dynamic = "force-dynamic";

import React, { useEffect } from "react";
import { useRouter } from "next/router";
import AuthDialog from "@/components/AuthDialog";

export default function LoginPage() {
  const router = useRouter();

  // 🔒 Vérifie si l’utilisateur est déjà connecté
  useEffect(() => {
    const estAuth = localStorage.getItem("estauthentifié");
    if (estAuth === "vrai") {
      router.push("/author-dashboard");
    }
  }, [router]);

  // 🔁 Callback après authentification réussie
  const handleAuthSuccess = () => {
    localStorage.setItem("estauthentifié", "vrai");
    router.push("/author-dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Connexion</h1>
          <p className="text-muted-foreground mt-2">
            Accédez à votre espace auteur sur <span className="font-semibold">Lisible</span>
          </p>
        </div>

        {/* ✅ AuthDialog gère toutes les méthodes de connexion */}
        <div className="flex justify-center mt-6">
          <AuthDialog onAuthSuccess={handleAuthSuccess} />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          En vous connectant, vous acceptez nos{" "}
          <a href="/terms" className="underline hover:text-primary">
            conditions d’utilisation
          </a>{" "}
          et notre{" "}
          <a href="/terms" className="underline hover:text-primary">
            politique de confidentialité
          </a>.
        </p>
      </div>
    </div>
  );
}