import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, db } from "@/lib/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function AuthDialog() {
  const [mode, setMode] = useState("login"); // "login" ou "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/dashboard"); // éviter retour au login
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Gestion email/mot de passe pour login ou signup
  const handleEmailAuth = async () => {
    setError("");
    setMessage("");
    try {
      let userCredential;

      if (mode === "login") {
        // Connexion
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Inscription
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Création du document Firestore pour l'auteur
        await setDoc(
          doc(db, "authors", userCredential.user.uid),
          {
            email,
            followers: 0,
            views: 0,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      router.push("/dashboard");
    } catch (e) {
      setError(e.message);
    }
  };

  // Gestion connexion Google
  const handleGoogleAuth = async () => {
    setError("");
    setMessage("");
    try {
      const result = await signInWithPopup(auth, provider);

      // Création ou mise à jour de l'auteur
      await setDoc(
        doc(db, "authors", result.user.uid),
        {
          email: result.user.email,
          followers: 0,
          views: 0,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      router.push("/dashboard");
    } catch (e) {
      setError(e.message);
    }
  };

  // Gestion du mot de passe oublié
  const handlePasswordReset = async () => {
    setError("");
    setMessage("");
    if (!email) {
      setError("Veuillez entrer votre email pour réinitialiser le mot de passe.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Un email de réinitialisation a été envoyé à votre adresse.");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {mode === "login" ? "Connexion" : "Inscription"}
      </h2>

      {/* Affichage des messages */}
      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
      {message && <div className="text-green-600 mb-2 text-sm">{message}</div>}

      {/* Connexion Google */}
      <button
        onClick={handleGoogleAuth}
        className="w-full bg-red-500 text-white py-2 rounded mb-4 hover:bg-red-600 transition"
      >
        Continuer avec Google
      </button>

      {/* Email et mot de passe */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 rounded mb-2"
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />

      <div className="flex flex-col gap-3">
        {/* Bouton principal login/signup */}
        <button
          onClick={handleEmailAuth}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {mode === "login" ? "Se connecter" : "S'inscrire"}
        </button>

        {/* Mot de passe oublié uniquement pour le mode login */}
        {mode === "login" && (
          <button
            onClick={handlePasswordReset}
            className="text-sm text-blue-600 hover:underline self-center"
          >
            Mot de passe oublié ?
          </button>
        )}
      </div>

      {/* Bascule entre connexion et inscription */}
      <div className="text-center mt-4">
        {mode === "login" ? (
          <p className="text-sm">
            Pas encore de compte ?{" "}
            <button
              onClick={() => setMode("signup")}
              className="text-blue-600 hover:underline"
            >
              S'inscrire
            </button>
          </p>
        ) : (
          <p className="text-sm">
            Vous avez déjà un compte ?{" "}
            <button
              onClick={() => setMode("login")}
              className="text-blue-600 hover:underline"
            >
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  );
}