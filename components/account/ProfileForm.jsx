"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ProfileSection({ user }) {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const ref = doc(db, "authors", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDisplayName(data.displayName || user.displayName || "");
        setBio(data.bio || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    const ref = doc(db, "authors", user.uid);
    await setDoc(ref, { displayName, bio, email: user.email }, { merge: true });
    alert("✅ Profil mis à jour !");
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Profil</h2>
      <div className="space-y-3">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border rounded-lg p-2"
          placeholder="Nom d’affichage"
        />
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full border rounded-lg p-2"
          rows={4}
          placeholder="Biographie ou présentation"
        />
        <button
          onClick={handleSave}
          className="bg-primary text-white rounded-lg px-4 py-2"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
}