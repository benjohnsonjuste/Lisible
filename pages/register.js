// pages/register.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  setDoc,
  doc,
  db,
  GoogleAuthProvider,
  signInWithPopup,
} from "../firebaseConfig";

export default function Register() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false); // bascule login/inscription
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // utilisé seulement en inscription
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Redirection si déjà connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  // Connexion ou inscription
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && !acceptTerms) {
      return alert("Vous devez accepter les termes et conditions pour continuer.");
    }
    setLoading(true);

    try {
      if (isLogin) {
        // Connexion
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Inscription
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          email,
          createdAt: new Date(),
        });
      }
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
          {isLogin ? "Connexion" : "Créer un compte"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          )}

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

          {!isLogin && (
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={() => setAcceptTerms(!acceptTerms)}
                className="mr-2"
              />
              J'accepte les{" "}
              <Link href="/terms">
                <a className="text-blue-600 hover:underline ml-1">Termes et Conditions</a>
              </Link>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
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
        {isLogin && (
          <button
            onClick={handleForgotPassword}
            className="mt-3 text-sm text-blue-600 hover:underline block text-center"
          >
            Mot de passe oublié ?
          </button>
        )}

        {/* Switch inscription/connexion */}
        <p className="text-center text-gray-600 mt-4">
          {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </button>
        </p>
      </div>
    </div>
  );
          }
