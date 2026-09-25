"use client";
import { useEffect } from "react";

// Enregistre discrètement l'activité de l'utilisateur (1 fois / jour max).
// Utilisé pour la clause de solde inactif (CGU, article 08).
export default function ActivityPing() {
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("lisible_user") || "null");
      if (!u?.email) return;
      const cle = "lisible_ping";
      const dernier = Number(localStorage.getItem(cle) || 0);
      if (Date.now() - dernier < 86400000) return;
      localStorage.setItem(cle, String(Date.now()));
      fetch("/api/coproduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toucher-activite", userEmail: u.email }),
      }).catch(() => {});
    } catch {}
  }, []);
  return null;
}
