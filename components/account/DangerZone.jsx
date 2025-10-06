"use client";
import React from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";

export default function DangerZone({ user }) {
  const handleDeactivate = async () => {
    if (confirm("Voulez-vous désactiver votre compte ?")) {
      await deleteDoc(doc(db, "authors", user.uid));
      alert("Compte désactivé (données supprimées).");
    }
  };

  const handleDelete = async () => {
    if (confirm("⚠️ Supprimer définitivement votre compte ?")) {
      try {
        await deleteUser(auth.currentUser);
        alert("Compte supprimé !");
      } catch (error) {
        alert("Erreur : " + error.message);
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-red-600 mb-4">Zone à risque</h2>
      <div className="space-y-4">
        <button
          onClick={handleDeactivate}
          className="w-full border border-yellow-500 text-yellow-600 rounded-lg px-4 py-2 hover:bg-yellow-50"
        >
          Désactiver le compte
        </button>
        <button
          onClick={handleDelete}
          className="w-full border border-red-500 text-red-600 rounded-lg px-4 py-2 hover:bg-red-50"
        >
          Supprimer définitivement
        </button>
      </div>
    </div>
  );
}