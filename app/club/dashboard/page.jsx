"use client";
import { useState, useEffect } from "react";
import LiveSystem from "@/components/LiveSystem";

export default function HostPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Récupération de l'utilisateur depuis le localStorage Lisible
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erreur de session");
      }
    } else {
      // Fallback sécurisé
      setUser({ penName: "Plume Admin", email: "adm.lablitteraire7@gmail.com", image: "" });
    }
  }, []);

  if (!user) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl animate-in fade-in zoom-in duration-500">
        {/* On passe isAdmin={true} car c'est la page Host (Studio) */}
        <LiveSystem currentUser={user} isAdmin={true} />
      </div>
    </div>
  );
}
