import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  auth, 
  provider // GoogleAuthProvider défini dans firebaseConfig
} from "../firebaseConfig";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChanged 
} from "firebase/auth";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Rediriger automatiquement si déjà connecté
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard/profil");
      }
    });
    return () => unsub();
  }, []);

  // Connexion email/password
  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard/profil");
    } catch (err) {
      setError(err.message);
    }
  };

  // Inscription email/password
  const handleRegister = async () => {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard/profil");
    } catch (err) {
      setError(err.message);
    }
  };

  // Connexion avec Google
  const handleGoogleLogin = async () => {
    setError("");
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard/profil");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
      <h2>Connexion / Inscription</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />

      <button 
        onClick={handleLogin} 
        style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#1976d2", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        Se connecter
      </button>

      <button 
        onClick={handleRegister} 
        style={{ width: "100%", padding: "10px", marginBottom: "10px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        S'inscrire
      </button>

      <button 
        onClick={handleGoogleLogin} 
        style={{ width: "100%", padding: "10px", background: "#db4437", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
      >
        Se connecter avec Google
      </button>
    </div>
  );
}