// pages/se-connecter/index.jsx
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AuthentificationLayout from "@/components/AuthentificationLayout";
import LoginForm from "@/LoginForm";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import InstallPrompt from "@/components/ui/InstallPrompt";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà authentifié
    const estAuth = localStorage.getItem("estauthentifié");
    if (estAuth === "vrai") {
      navigate("/auteur-tableau-de-bord");
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      // Simuler délai d'authentification Google
      await new Promise((resolve) => setTimeout(resolve, 1500));
      localStorage.setItem("estauthentifié", "vrai");
      localStorage.setItem("loginMethod", "google");
      navigate("/auteur-tableau-de-bord");
    } catch (error) {
      console.error("Connexion Google échouée :", error);
    }
  };

  const handleForgotPassword = () => {
    setIsForgotPasswordOpen(true);
  };

  return (
    <AuthenticationLayout
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

      <InstallPrompt />
    </AuthenticationLayout>
  );
};

export default LoginPage;