"use client";

import { useState } from "react";
import { toast } from "sonner";

async function saveUserToGitHub(user) {
  try {
    const res = await fetch("/api/save-user-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    if (!res.ok) {
      throw new Error("Impossible d’enregistrer l’utilisateur.");
    }

    return await res.json();
  } catch (err) {
    console.error("Erreur GitHub :", err);
    return null;
  }
}

export default function AuthForm({ onAuth }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !fullName) {
      toast.error("Tous les champs sont requis");
      return;
    }

    const user = {
      uid: crypto.randomUUID(),
      email,
      fullName,
    };

    const saved = await saveUserToGitHub(user);
    if (!saved) return;

    toast.success("Compte créé avec succès !");
    onAuth(user);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded">
      <input
        type="text"
        placeholder="Nom complet"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="email"
        placeholder="Adresse email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        Continuer
      </button>
    </form>
  );
}