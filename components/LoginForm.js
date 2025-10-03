// components/LoginForm.jsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import Input from "@/components/ui/Input";
import Bouton from "@/components/ui/Bouton";
import { Checkbox } from "@/components/ui/Checkbox";
import Icon from "@/components/AppIcon";

const mockCredentials = {
  email: "auteur@lisible.fr",
  motdepasse: "Lisible2025!",
};

const LoginForm = ({ onGoogleLogin, onForgotPassword }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    motdepasse: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "L'adresse e-mail est requise";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format d'e-mail invalide";
    }
    if (!formData.motdepasse) {
      newErrors.motdepasse = "Le mot de passe est requis";
    } else if (formData.motdepasse.length < 6) {
      newErrors.motdepasse = "Le mot de passe doit contenir au moins 6 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulation d'authentification
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (
        formData.email === mockCredentials.email &&
        formData.motdepasse === mockCredentials.motdepasse
      ) {
        localStorage.setItem("estauthentifié", "vrai");
        localStorage.setItem("loginMethod", "local");
        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        }
        navigate("/auteur-tableau-de-bord");
      } else {
        setErrors({ general: `Identifiants incorrects. Utiliser ${mockCredentials.email} / ${mockCredentials.motdepasse}` });
      }
    } catch (error) {
      setErrors({ general: "Une erreur est survenue lors de la connexion" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="p-4 border bg-error/10 border-error/20 rounded-lg">
          <Icon name="AlertCircle" size={16} className="mr-2" />
          <span className="text-sm text-error">{errors.general}</span>
        </div>
      )}

      <Input
        label="Adresse e-mail"
        type="email"
        name="email"
        placeholder="votre@email.com"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
        disabled={isLoading}
        required
      />

      <Input
        label="Mot de passe"
        type="password"
        name="motdepasse"
        placeholder="Votre mot de passe"
        value={formData.motdepasse}
        onChange={handleInputChange}
        error={errors.motdepasse}
        disabled={isLoading}
        required
      />

      <div className="flex items-center justify-between">
        <Checkbox
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading}
        >
          Se souvenir de moi
        </Checkbox>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-primary hover:underline"
        >
          Mot de passe oublié ?
        </button>
      </div>

      <Button type="submit" loading={isLoading} fullWidth>
        Connexion
      </Button>

      <div className="text-center text-sm text-muted">ou</div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={onGoogleLogin}
        disabled={isLoading}
        iconName="Chrome"
        iconPosition="left"
      >
        Continuer avec Google
      </Button>

      <div className="text-center text-sm mt-4">
        Pas encore de compte ?{" "}
        <button
          type="button"
          className="text-primary font-medium hover:underline"
          onClick={() => navigate("/registre")}
          disabled={isLoading}
        >
          Créer un compte
        </button>
      </div>
    </form>
  );
};

export default LoginForm;