// components/account-management/SecuritySection.jsx
import React, { useState } from "react";
import Bouton from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import AppIcon from "@/components/AppIcon";
import Checkbox from "@/components/ui/Checkbox";

const SecuritySection = ({ securityData, onSecurityUpdate }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailForm, setEmailForm] = useState({
    email: securityData?.email || "",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(securityData?.twoFactorEnabled || false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSavePassword = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setErrors({ confirmPassword: "Les mots de passe ne correspondent pas." });
        return;
      }
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSecurityUpdate({ password: passwordForm.newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      setErrors({ global: "Impossible de changer le mot de passe." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onSecurityUpdate({ email: emailForm.email });
      setShowEmailForm(false);
    } catch (error) {
      setErrors({ global: "Impossible de mettre à jour l'email." });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTwoFactor = async () => {
    setIsLoading(true);
    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTwoFactorEnabled((prev) => !prev);
      onSecurityUpdate({ twoFactorEnabled: !twoFactorEnabled });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-red-50 rounded-lg space-y-6">
      <h2 className="text-xl font-bold text-red-700 mb-4">Sécurité du compte</h2>

      {/* Changement de mot de passe */}
      <div>
        <Bouton variante="secondary" onClick={() => setShowPasswordForm((prev) => !prev)}>
          {showPasswordForm ? "Annuler" : "Changer le mot de passe"}
        </Bouton>
        {showPasswordForm && (
          <div className="mt-4 space-y-4">
            <Input
              label="Mot de passe actuel"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
            />
            <Input
              label="Nouveau mot de passe"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
            />
            <Input
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
            />
            {errors.global && <p className="text-red-600 text-sm">{errors.global}</p>}
            <Bouton variante="primary" onClick={handleSavePassword} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Bouton>
          </div>
        )}
      </div>

      {/* Changement d'email */}
      <div>
        <Bouton variante="secondary" onClick={() => setShowEmailForm((prev) => !prev)}>
          {showEmailForm ? "Annuler" : "Changer l'email"}
        </Bouton>
        {showEmailForm && (
          <div className="mt-4 space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={emailForm.email}
              onChange={handleEmailChange}
            />
            <Bouton variante="primary" onClick={handleSaveEmail} disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Bouton>
          </div>
        )}
      </div>

      {/* Authentification à deux facteurs */}
      <div className="flex items-center space-x-2">
        <Checkbox checked={twoFactorEnabled} onChange={toggleTwoFactor} />
        <span>Activer l'authentification à deux facteurs</span>
      </div>
    </div>
  );
};

export default SecuritySection;