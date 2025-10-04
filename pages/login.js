"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AuthentificationLayout from "@/components/ui/AuthentificationLayout";
import LoginForm from "@/components/LoginForm";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

const LoginPage = () => {
  const router = useRouter();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    const estAuth = localStorage.getItem("estauthentifié");
    if (estAuth === "vrai") {
      router.push("/auteur-tableau-de-bord");
    }
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      localStorage.setItem("estauthentifié", "vrai");
      localStorage.setItem("loginMethod", "google");
      router.push("/auteur-tableau-de-bord");
    } catch (error) {
      console.error("Connexion Google échouée :", error);
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPasswordOpen(true);
  };

  return (
    <AuthentificationLayout
      title="Connexion"
      subtitle="Gérez vos publications et votre compte"
    >
      <LoginForm
        onGoogleLogin={handleGoogleLogin}
        onForgotPassword={handleForgotPassword}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

    </AuthentificationLayout>
  );
};

export default LoginPage;