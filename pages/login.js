// pages/login.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "../firebaseConfig";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirection si déjà connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  // Connexion classique
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
    setLoading(false);
  };

  // Mot de passe oublié
  const handleForgotPassword = async () => {
    if (!email) return alert("Entrez votre email avant de réinitialiser.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email de réinitialisation envoyé !");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  };

  // Connexion via Google
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err) {
      alert("Erreur Google : " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Connexion
        </h2>

        {/* Formulaire de connexion */}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Chargement..." : "Se connecter"}
          </button>
        </form>

        {/* Connexion Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full mt-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Continuer avec Google
        </button>

        {/* Mot de passe oublié */}
        <button
          onClick={handleForgotPassword}
          className="mt-3 text-sm text-blue-600 hover:underline block text-center"
        >
          Mot de passe oublié ?
        </button>

        {/* Lien vers inscription */}
        <p className="text-center text-gray-600 mt-4">
          Pas encore de compte ?{" "}
          <Link href="/register">
            <span className="text-blue-600 hover:underline cursor-pointer">
              Créer un compte
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
              }
