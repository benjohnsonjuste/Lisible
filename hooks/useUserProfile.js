// hooks/useUserProfile.js
"use client";

import { useEffect, useState } from "react";

/**
 * useUserProfile
 * - tente de récupérer /api/auth/me (GET)
 * - attend { ok: true, user: { ... } } ou 401
 *
 * ADAPTE : implémente /api/auth/me sur ton backend (NextAuth, Firebase, etc.)
 */

export function useUserProfile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/auth/me");
        if (!mounted) return;
        if (res.ok) {
          const json = await res.json();
          setUser(json.user || null);
        } else {
          // not authenticated or error
          setUser(null);
        }
      } catch (err) {
        console.error("useUserProfile error:", err);
        setError(err);
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchMe();

    return () => {
      mounted = false;
    };
  }, []);

  return { user, isLoading, error };
}

export default useUserProfile;