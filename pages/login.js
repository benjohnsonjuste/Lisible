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
      title="Connexion"
      subtitle="Accédez à votre espace auteur sur Lisible"
    >
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
  );
}