"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = localStorage.getItem("lisible_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          
          // Synchronisation avec l'API unifiée pour avoir le solde de Li réel
          const res = await fetch(`/api/github-db?type=user&id=${parsed.email}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.content) {
              setUser(data.content);
              localStorage.setItem("lisible_user", JSON.stringify(data.content));
            } else {
              setUser(parsed);
            }
          } else {
            setUser(parsed);
          }
        }
      } catch (err) {
        console.error("Erreur AuthContext Sync:", err);
        setError("Impossible de charger la session");
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Écouter les changements de session entre les onglets
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("lisible_user");
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
