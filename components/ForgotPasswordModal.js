import React, { useState } from "react";
import { Bouton } from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import AppIcon from "@/components/AppIcon";
import InstallPrompt from "@/components/ui/InstallPrompt";
import { CheckCircle, X } from "lucide-react";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("L'adresse e-mail est requise");
      return;
    }
    if (!validateEmail(email)) {
      setError("Format d'e-mail invalide");
      return;
    }

    setIsLoading(true);
    try {
      // Simuler envoi de lien de réinitialisation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSuccess(true);
    } catch {
      setError("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative animate-fade-in">
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted"
          onClick={handleClose}
          disabled={isLoading}
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center space-y-4 mb-4">
          <AppIcon src="/icon.png" alt="Lisible Logo" className="w-12 h-12" />
          <h2 className="text-xl font-semibold text-center">Mot de passe oublié</h2>
          <p className="text-sm text-center text-muted-foreground">
            Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {isSuccess ? (
          <div className="flex flex-col items-center space-y-4 text-center">
            <CheckCircle className="w-16 h-16 text-success" />
            <p className="text-lg font-medium text-success">
              E-mail envoyé ! Vérifiez votre boîte de réception.
            </p>
            <Button onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Adresse e-mail"
              type="email"
              name="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              disabled={isLoading}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Envoi..." : "Envoyer"}
            </Button>
          </form>
        )}
      </div>

      <InstallPrompt />
    </div>
  );
};

export default ForgotPasswordModal;
