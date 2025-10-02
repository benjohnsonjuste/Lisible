// components/account-management/PaymentSection.jsx
import React, { useState } from "react";
import Bouton from "@/components/ui/Bouton";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import AppIcon from "@/components/AppIcon";

const PaymentSection = ({ paymentData, onPaymentUpdate }) => {
  const [formData, setFormData] = useState({
    titulaire: paymentData?.titulaire || "",
    iban: paymentData?.iban || "",
    bic: paymentData?.bic || "",
    bankName: paymentData?.bankName || "",
    taxId: paymentData?.taxId || "",
    businessType: paymentData?.businessType || "individuel",
    payoutFrequency: paymentData?.payoutFrequency || "mensuel",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const businessTypeOptions = [
    { value: "individuel", label: "Individuel" },
    { value: "freelance", label: "Auto-entrepreneur" },
    { value: "entreprise", label: "Entreprise" },
    { value: "association", label: "Association" },
  ];

  const payoutFrequencyOptions = [
    { value: "hebdomadaire", label: "Hebdomadaire" },
    { value: "mensuel", label: "Mensuel" },
    { value: "trimestriel", label: "Trimestriel" },
  ];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      // Simulation d'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onPaymentUpdate(formData);
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données de paiement", error);
      setErrors({ global: "Impossible de mettre à jour les informations de paiement." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-green-50 rounded-lg space-y-6">
      <h2 className="text-xl font-bold text-green-700 mb-4">Informations de paiement</h2>

      <Input
        label="Titulaire du compte"
        value={formData.titulaire}
        onChange={(e) => handleChange("titulaire", e.target.value)}
      />

      <Input
        label="IBAN"
        value={formData.iban}
        onChange={(e) => handleChange("iban", e.target.value)}
      />

      <Input
        label="BIC"
        value={formData.bic}
        onChange={(e) => handleChange("bic", e.target.value)}
      />

      <Input
        label="Nom de la banque"
        value={formData.bankName}
        onChange={(e) => handleChange("bankName", e.target.value)}
      />

      <Input
        label="Numéro de TVA / Identifiant fiscal"
        value={formData.taxId}
        onChange={(e) => handleChange("taxId", e.target.value)}
      />

      <Select
        label="Type d'entreprise"
        value={formData.businessType}
        options={businessTypeOptions}
        onChange={(value) => handleChange("businessType", value)}
      />

      <Select
        label="Fréquence de paiement"
        value={formData.payoutFrequency}
        options={payoutFrequencyOptions}
        onChange={(value) => handleChange("payoutFrequency", value)}
      />

      {errors.global && (
        <p className="text-red-600 text-sm">{errors.global}</p>
      )}

      <div className="flex justify-end mt-4">
        <Bouton variante="primary" onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Enregistrement..." : "Enregistrer"}
        </Bouton>
      </div>
    </div>
  );
};

export default PaymentSection;