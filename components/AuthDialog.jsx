"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthDialog({ type = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Ici, tu pourras connecter Firebase ou une API
      if (!email || !password) {
        throw new Error("Veuillez remplir tous les champs.");
      }

      // Simulation de connexion
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const handleGoogleSignIn = () => {
    alert("Connexion avec Google (à implémenter plus tard)");
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-auto my-10 border">
      <h1 className="text-2xl font-bold mb-4 text-center">
        {type === "login" ? "Connexion" : "Inscription"}
      </h1>

      {error && (
        <div className="bg-red-100 text-red-600 p-2 mb-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
        >
          Continuer avec Google
        </button>

        <div className="relative">
          <input
            type="email"
            placeholder="Email"
            className="w-full border p-2 rounded focus:ring focus:ring-blue-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full border p-2 rounded focus:ring focus:ring-blue-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition disabled:opacity-50"
        >
          {loading
            ? "Chargement..."
            : type === "login"
            ? "Se connecter"
            : "S’inscrire"}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-600 text-sm">
        {type === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              S’inscrire
            </a>
          </>
        ) : (
          <>
            Déjà inscrit ?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </a>
          </>
        )}
      </p>
    </div>
  );
          }
