"use client";
import { useEffect } from "react";
import { getSessionToken } from "../lib/session-client.js";

// Enregistre discrètement l'activité de l'utilisateur (1 fois / jour max).
// Utilisé pour la clause de solde inactif (CGU, article 08).
export default function ActivityPing() {
  useEffect(() => {
    try {
      const token = getSessionToken();
      if (!token) return;
      const cle = "lisible_ping";
      const dernier = Number(localStorage.getItem(cle) || 0);
      if (Date.now() - dernier < 86400000) return;
      localStorage.setItem(cle, String(Date.now()));
      fetch("/api/coproduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toucher-activite", sessionToken: token }),
      }).catch(() => {});
    } catch {}
  }, []);
  return null;
}
