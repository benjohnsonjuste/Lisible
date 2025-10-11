"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, db } from "@/lib/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc"; // ✅ Icône Google (alternative à lucide)
import ForgotPasswordModal from "@/components/ForgotPasswordModal"; // ✅ Ton composant modal
import { toast } from "sonner";

export default function AuthDialog() {
  const [mode, setMode] = useState("login"); // "login" ou "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false); // ✅ état du modal
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/author-dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Connexion ou inscription par email
  const handleEmailAuth = async () => {
    setError("");
    try {
      let userCredential;
      if (mode === "login") {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
      router.push("/author-dashboard");
    } catch (e) {
      setError(e.message);
      toast.error("Erreur : " + e.message);
    }
  };

  // Connexion Google
  const handleGoogleAuth = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
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
      router.push("/author-dashboard");
    } catch (e) {
      setError(e.message);
      toast.error("Erreur Google : " + e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {mode === "login" ? "Connexion" : "Inscription"}
      </h2>

      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

      {/* 🔹 Connexion Google avec icône */}
      <button
        onClick={handleGoogleAuth}
        className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded mb-4 hover:bg-black-600 transition"
      >
        <FcGoogle size={20} /> {/* ✅ Icône Google */}
        <span>Continuer avec Google</span>
      </button>

      {/* 🔹 Email et mot de passe */}
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
        <button
          onClick={handleEmailAuth}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {mode === "login" ? "Se connecter" : "S'inscrire"}
        </button>

        {/* 🔹 Lien vers modal Mot de passe oublié */}
        {mode === "login" && (
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(true)}
            className="text-sm text-blue-600 hover:underline self-center"
          >
            Mot de passe oublié ?
          </button>
        )}
      </div>

      {/* 🔹 Changement de mode */}
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

      {/* 🔹 Composant modal pour réinitialisation */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          onClose={() => setIsForgotModalOpen(false)}
          email={email}
        />
      )}
    </div>
  );
}