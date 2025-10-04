// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// 🔒 Crée le contexte avec null par défaut
const AuthContext = createContext(null);

// ✅ Provider global pour l'application
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Hook sécurisé pour accéder au contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    // Sécurité renforcée pour éviter les erreurs de build
    console.warn("useAuth must be used within an AuthProvider");
    return { user: null, loading: true };
  }
  return context;
}