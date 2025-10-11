"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
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
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <AuthDialog onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}