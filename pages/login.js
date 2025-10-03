// pages/login.jsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Bouton } from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import AppIcon from "@/components/AppIcon";
import InstallPrompt from "@/components/ui/InstallPrompt";

const mockCredentials = {
  email: "auteur@lisible.fr",
  password: "Lisible2025!",
};

const LoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "L'adresse e-mail est requise";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Format d'e-mail invalide";

    if (!formData.password) newErrors.password = "Le mot de passe est requis";
    else if (formData.password.length < 6) newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    if (!validateForm()) return;

    setIsLoading(true);

    // Simuler une requête d'authentification
    setTimeout(() => {
      if (
        formData.email === mockCredentials.email &&
        formData.password === mockCredentials.password
      ) {
        localStorage.setItem("estAuthentifie", formData.rememberMe ? "true" : "false");
        router.push("/author-dashboard"); // redirection vers tableau de bord
      } else {
        setGeneralError("Identifiants incorrects.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <AppIcon src="/icon.png" alt="Lisible Logo" className="w-12 h-12" />
          <h1 className="text-2xl font-semibold text-primary">Se connecter</h1>
        </div>

        {generalError && (
          <div className="p-4 border bg-error/10 border-error rounded-md text-error text-sm">
            {generalError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Adresse e-mail"
            type="email"
            name="email"
            placeholder="votre@email.com"
            value={formData.email}
            onChange={handleInputChange}
            error={errors?.email}
            disabled={isLoading}
          />

          <Input
            label="Mot de passe"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleInputChange}
            error={errors?.password}
            disabled={isLoading}
          />

          <div className="flex items-center justify-between">
            <Checkbox
              label="Se souvenir de moi"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
            />
            <Button
              variant="link"
              onClick={() => router.push("/forgot-password")}
              className="text-sm"
            >
              Mot de passe oublié ?
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Button variant="link" onClick={() => router.push("/register")}>
            Créer un compte
          </Button>
        </div>
      </div>

      <InstallPrompt />
    </div>
  );
};

export default LoginForm;