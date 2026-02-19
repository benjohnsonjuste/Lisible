"use client";
import { useState, useEffect } from "react";
import ClubDashboard from "@/components/ClubDashboard";

export default function HostPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Récupération de l'utilisateur depuis le localStorage (ou ta session)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Fallback ou redirection si non connecté
      setUser({ name: "Auteur Lisible", email: "guest@lisible.com", avatar: "" });
    }
  }, []);

  if (!user) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500">
        <ClubDashboard currentUser={user} />
      </div>
    </div>
  );
}
