"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updatePassword } from "firebase/auth";

export default function SecuritySettings() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!user) {
      alert("⚠️ Vous devez être connecté pour changer votre mot de passe.");
      return;
    }
    if (password !== confirm || password.length < 6) {
      alert("⚠️ Les mots de passe ne correspondent pas ou sont trop courts (min. 6 caractères).");
      return;
    }

    try {
      setLoading(true);
      await updatePassword(user, password);
      alert("🔒 Mot de passe mis à jour avec succès !");
      setPassword("");
      setConfirm("");
    } catch (error) {
      console.error(error);
      alert("Erreur : " + (error.message || "Impossible de mettre à jour le mot de passe."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">🔐 Sécurité</h2>

      <div className="space-y-3 max-w-md">
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-lg p-2"
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-border rounded-lg p-2"
        />

        <button
          onClick={handleChange}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400" : "bg-primary hover:bg-primary/90"
          }`}
        >
          {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
        </button>
      </div>
    </section>
  );
}