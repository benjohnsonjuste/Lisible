"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import { toast } from "sonner";

/**
 * Enregistre un utilisateur côté GitHub (data/users.json)
 * Appelle l'API server-side /api/save-user-github
 */
async function saveUserToGitHub(user) {
  try {
    await fetch("/api/save-user-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.error("Erreur enregistrement GitHub:", error);
  }
}

export default function AuthDialog() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const redirect = params?.get("redirect") || "/bibliotheque";

  const provider = new GoogleAuthProvider();

  // redirect if already authenticated
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        // already logged in -> go to redirect
        router.replace(redirect);
      }
    });
    return () => unsub();
  }, [router, redirect]);

  // ===== Email sign-in / signup handler =====
  const handleEmailAuth = async (e) => {
    // This handler may be triggered by button.click (not a form submit) but still safe to preventDefault
    e?.preventDefault?.();
    setError("");

    try {
      let userCredential;
      if (mode === "login") {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // signup
        if (!fullName.trim()) {
          toast.error("Veuillez entrer votre nom complet.");
          return;
        }

        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // set displayName in Firebase Auth profile
        await updateProfile(user, { displayName: fullName });

        // Save user in Firestore "authors" collection
        await setDoc(
          doc(db, "authors", user.uid),
          {
            uid: user.uid,
            email: user.email || "",
            fullName,
            followers: 0,
            views: 0,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Save to GitHub (non-blocking)
        saveUserToGitHub({
          uid: user.uid,
          fullName,
          email: user.email || "",
        });
      }

      toast.success("Connexion réussie !");
      router.push(redirect);
    } catch (e) {
      console.error("Auth error:", e);
      setError(e?.message || "Erreur");
      toast.error("Erreur : " + (e?.message || "Erreur"));
    }
  };

  // ===== Google Auth handler =====
  const handleGoogleAuth = async (e) => {
    e?.preventDefault?.();
    setError("");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // normalize display name
      const name = user.displayName || "";

      await setDoc(
        doc(db, "authors", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          fullName: name,
          followers: 0,
          views: 0,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Save to GitHub (non-blocking)
      saveUserToGitHub({
        uid: user.uid,
        fullName: name,
        email: user.email || "",
      });

      toast.success("Connexion réussie avec Google !");
      router.push(redirect);
    } catch (e) {
      console.error("Google auth error:", e);
      setError(e?.message || "Erreur Google");
      toast.error("Erreur Google : " + (e?.message || "Erreur"));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4 text-center">
        {mode === "login" ? "Connexion" : "Inscription"}
      </h2>

      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

      <button
        onClick={handleGoogleAuth}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded mb-4 hover:bg-black transition"
        type="button"
      >
        <FcGoogle size={20} />
        <span>Continuer avec Google</span>
      </button>

      {mode === "signup" && (
        <input
          type="text"
          placeholder="Nom complet"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border p-2 rounded mb-2"
        />
      )}

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
          type="button"
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
            Pas encore de compte?{" "}
            <button
              onClick={() => setMode("signup")}
              className="text-blue-600 hover:underline"
              type="button"
            >
              S'inscrire
            </button>
          </p>
        ) : (
          <p className="text-sm">
            Vous avez déjà un compte?{" "}
            <button
              onClick={() => setMode("login")}
              className="text-blue-600 hover:underline"
              type="button"
            >
              Se connecter
            </button>
          </p>
        )}
      </div>

      {isForgotModalOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotModalOpen(false)} email={email} />
      )}
    </div>
  );
}