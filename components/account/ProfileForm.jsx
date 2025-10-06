"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ProfileSection({ user }) {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!user?.uid) return; // sécurité

    const fetchProfile = async () => {
      try {
        const ref = doc(db, "authors", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setDisplayName(data.displayName || user.displayName || "");
          setBio(data.bio || "");
        } else {
          // Préremplir si aucun profil
          setDisplayName(user.displayName || "");
        }
      } catch (error) {
        console.error("Erreur de récupération du profil :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) {
      alert("⚠️ Vous devez être connecté pour modifier votre profil.");
      return;
    }

    try {
      const ref = doc(db, "authors", user.uid);
      await setDoc(
        ref,
        {
          displayName,
          bio,
          email: user.email,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      alert("✅ Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      alert("❌ Une erreur est survenue lors de la mise à jour du profil.");
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Chargement du profil...</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">👤 Profil</h2>

      <div className="space-y-3 max-w-md">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-border rounded-lg p-2"
          placeholder="Nom d’affichage"
        />

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full border border-border rounded-lg p-2"
          rows={4}
          placeholder="Biographie ou présentation"
        />

        <button
          onClick={handleSave}
          className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 transition"
        >
          Sauvegarder
        </button>
      </div>
    </section>
  );
}