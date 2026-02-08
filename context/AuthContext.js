// context/AuthContext.js
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
    const loadUser = () => {
      try {
        // On récupère l'utilisateur depuis le localStorage (système Lisible)
        const savedUser = localStorage.getItem("lisible_user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error("Erreur AuthContext:", err);
        setError("Impossible de charger la session");
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Écouter les changements de session (connexion/déconnexion)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("lisible_user");
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {/* On affiche children sans condition pour libérer le Header/Footer */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
