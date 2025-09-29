"use client"; // Force rendu côté client

import { useState, useEffect } from "react";
import LisibleClubDashboard from "@/components/LisibleClubDashboard";
import LisibleClubViewer from "@/components/LisibleClubViewer";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function LisibleClubPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-red-500">
          Connectez-vous pour accéder à Lisible Club.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Dashboard pour publier */}
      <LisibleClubDashboard author={{ id: user.uid, name: user.displayName || "Auteur" }} />

      {/* Viewer pour voir les publications */}
      <LisibleClubViewer />
    </div>
  );
}