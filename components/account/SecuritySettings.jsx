"use client";
import React, { useState } from "react";
import { auth } from "@/lib/firebaseConfig";
import { updatePassword } from "firebase/auth";

export default function SecuritySection() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleChange = async () => {
    if (password !== confirm || password.length < 6) {
      alert("⚠️ Les mots de passe ne correspondent pas ou sont trop courts.");
      return;
    }
    try {
      await updatePassword(auth.currentUser, password);
      alert("🔒 Mot de passe mis à jour !");
    } catch (error) {
      alert("Erreur : " + error.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sécurité</h2>
      <div className="space-y-3">
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
        <button
          onClick={handleChange}
          className="bg-primary text-white rounded-lg px-4 py-2"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  );
}