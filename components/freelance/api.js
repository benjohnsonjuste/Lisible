"use client";

// Helpers pour dialoguer avec /api/freelance.
// Le token de session et l'utilisateur sont stockés dans localStorage par la page de connexion.

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("lisible_session");
}

export function getSessionUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lisible_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getSessionToken();
}

// POST /api/freelance { action, sessionToken, ...data }
export async function apiPost(action, data = {}) {
  const sessionToken = getSessionToken();
  const res = await fetch("/api/freelance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, sessionToken, ...data }),
  });
  let j = null;
  try {
    j = await res.json();
  } catch {
    throw new Error("Réponse du serveur illisible.");
  }
  if (!res.ok || (j && j.error)) {
    throw new Error((j && j.error) || "Une erreur est survenue.");
  }
  return j;
}

// GET /api/freelance?action=...&k=v
export async function apiGet(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params });
  const res = await fetch(`/api/freelance?${qs.toString()}`);
  let j = null;
  try {
    j = await res.json();
  } catch {
    throw new Error("Réponse du serveur illisible.");
  }
  if (!res.ok || (j && j.error)) {
    throw new Error((j && j.error) || "Une erreur est survenue.");
  }
  return j;
}

export const CATEGORIES = [
  "Relecture",
  "Correction",
  "Mise en pages",
  "Couverture",
  "Traduction",
  "Illustration",
  "Formatage e-book",
  "Transcription",
  "Coaching d'écriture",
  "Autre",
];

export const STATUS_LABELS = {
  draft: "Brouillon",
  open: "Ouverte",
  assigned: "En cours",
  delivered: "Livré",
  completed: "Terminée",
  cancelled: "Annulée",
  disputed: "Litige",
  refunded: "Remboursée",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function formatDateFR(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}
