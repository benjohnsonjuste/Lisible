"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import { toast } from "sonner";

// 🔹 Fonction utilitaire pour enregistrer sur GitHub
async function saveUserToGitHub(user) {
  try {
    await fetch("/api/save-user-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        authorName: user.displayName || user.email || "Auteur inconnu",
        authorEmail: user.email,
        penName: "",
        birthday: "",
        paymentMethod: "",
        paypalEmail: "",
        wuMoneyGram: null,
        subscribers: [],
      }),
    });
  } catch (error) {
    console.error("Erreur enregistrement GitHub:", error);
  }
}

export default function AuthDialog() {
  const [mode, setMode] = useState("login"); // "login" ou "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const provider = new GoogleAuthProvider();

  // 🔹 Récupérer la redirection après login (par ex: /bibliotheque)
  const redirect = params.get("redirect") || "/bibliotheque";

  // 🔹 Rediriger si déjà connecté
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace(redirect);
      }
    });
    return () => unsubscribe();
  }, [router, redirect]);

  // 🔹 Authentification par email
  const handleEmailAuth = async () => {
    setError("");
    try {
      let userCredential;
      if (mode === "login") {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        const user = userCredential.user;
        // Enregistrer sur Firebase
        await setDoc(
          doc(db, "authors", user.uid),
          {
            email,
            followers: 0,
            views: 0,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Enregistrer aussi sur GitHub
        await saveUserToGitHub(user);
      }

      toast.success("Connexion réussie !");
      router.push(redirect);
    } catch (e) {
      setError(e.message);
      toast.error("Erreur : " + e.message);
    }
  };

  // 🔹 Authentification Google
  const handleGoogleAuth = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Enregistrer sur Firebase
      await setDoc(
        doc(db, "authors", user.uid),
        {
          email: user.email,
          name: user.displayName || "",
          followers: 0,
          views: 0,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Enregistrer aussi sur GitHub
      await saveUserToGitHub(user);

      toast.success("Connexion réussie avec Google !");
      router.push(redirect);
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

      {/* 🔹 Connexion Google */}
      <button
        onClick={handleGoogleAuth}
        className="w-full flex items-center justify-center gap-2 bg-black-500 text-white py-2 rounded mb-4 hover:bg-black transition"
      >
        <FcGoogle size={20} />
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

      {/* 🔹 Modal mot de passe oublié */}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          onClose={() => setIsForgotModalOpen(false)}
          email={email}
        />
      )}
    </div>
  );
}