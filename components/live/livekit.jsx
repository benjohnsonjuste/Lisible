"use client";
import { LivepeerConfig, createReactClient, studioProvider } from "@livepeer/react";

export const LIVE_DURATION_MS = 15 * 60 * 1000; // 15 minutes pour l'instant
export const PUSHER_KEY = "1da55287e2911ceb01dd";
export const PUSHER_CLUSTER = "us2";

const livepeerClient = createReactClient({
  provider: studioProvider({ apiKey: "f15e0657-3f95-46f3-8b77-59f0f909162c" }),
});

export function LivepeerProvider({ children }) {
  return <LivepeerConfig client={livepeerClient}>{children}</LivepeerConfig>;
}

export function sanitizeChannel(email) {
  return `live-invite-${String(email || "").toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("lisible_user") || "null");
  } catch {
    return null;
  }
}

export function formatCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
