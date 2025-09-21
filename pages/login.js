import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, signInWithEmailAndPassword } from "../firebaseConfig";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) router.push("/dashboard"); // Redirection si déjà connecté
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard"); // Redirection après connexion
    } catch (err) {
      alert("Erreur : " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      {/* Boîte de dialogue */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 relative">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Connexion
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Champ Email */}
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="relative">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Lien vers inscription */}
        <p className="text-center text-gray-500 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/register">
            <a className="text-blue-600 font-medium hover:underline">S'inscrire</a>
          </Link>
        </p>
      </div>
    </div>
  );
                }
