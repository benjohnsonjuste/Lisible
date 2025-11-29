"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import { toast } from "sonner";

// 🔹 Fonction utilitaire pour enregistrer sur GitHub
async function saveUserToGitHub(user: {
  uid: string;
  email: string | null;
  fullName: string;
}) {
  try {
    const res = await fetch("/api/save-user-github", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        authorName: user.fullName || user.email || "Auteur inconnu",
        authorEmail: user.email,
        penName: user.fullName || "",
        birthday: "",
        paymentMethod: "",
        paypalEmail: "",
        wuMoneyGram: null,
        subscribers: [],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Erreur GitHub (HTTP):", res.status, txt);
      toast.warning("Enregistrement GitHub non confirmé. Réessaie plus tard.");
    }
  } catch (error) {
    console.error("Erreur enregistrement GitHub:", error);
    toast.warning("Enregistrement GitHub indisponible pour le moment.");
  }
}

export default function AuthDialog() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const redirect = params?.get("redirect") || "/bibliotheque";

  // 🔹 Configurer le provider Google
  const provider = useMemo(() => {
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    return p;
  }, []);

  // 🔹 Rediriger si déjà connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace(redirect);
    });
    return () => unsubscribe();
  }, [router, redirect]);

  // 🔹 Gérer le résultat d'un éventuel signInWithRedirect
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const user = result.user;
          await setDoc(
            doc(db, "authors", user.uid),
            {
              uid: user.uid,
              email: user.email ?? "",
              fullName: user.displayName ?? "",
              followers: 0,
              views: 0,
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );

          await saveUserToGitHub({
            uid: user.uid,
            email: user.email,
            fullName: user.displayName ?? "",
          });

          toast.success("Connexion réussie avec Google !");
          router.push(redirect);
        }
      } catch (e: any) {
        console.error(e);
        setError(parseFirebaseError(e));
        toast.error("Erreur Google (redirect) : " + parseFirebaseError(e));
      }
    })();
  }, [router, redirect]);

  // 🔹 Validation simple
  function validateInputs() {
    if (!email.trim()) {
      toast.error("Veuillez entrer votre email.");
      return false;
    }
    if (!password.trim()) {
      toast.error("Veuillez entrer votre mot de passe.");
      return false;
    }
    if (mode === "signup" && !fullName.trim()) {
      toast.error("Veuillez entrer votre nom complet.");
      return false;
    }
    return true;
  }

  // 🔹 Normalisation auteur Firestore
  async function upsertAuthorInFirestore({
    uid,
    email,
    fullName,
  }: {
    uid: string;
    email: string | null;
    fullName: string;
  }) {
    await setDoc(
      doc(db, "authors", uid),
      {
        uid,
        email: email ?? "",
        fullName,
        followers: 0,
        views: 0,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // 🔹 Messages d'erreurs Firebase lisibles
  function parseFirebaseError(e: any) {
    const code = e?.code ?? "";
    const msg = e?.message ?? "Erreur inconnue.";
    switch (code) {
      case "auth/invalid-email":
        return "Email invalide.";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Email ou mot de passe incorrect.";
      case "auth/email-already-in-use":
        return "Cet email est déjà utilisé.";
      case "auth/popup-blocked":
        return "Popup bloqué par le navigateur.";
      case "auth/popup-closed-by-user":
        return "Popup fermé avant la connexion.";
      case "auth/weak-password":
        return "Mot de passe trop faible.";
      default:
        return msg;
    }
  }

  // 🔹 Authentification Email / Mot de passe
  const handleEmailAuth = async () => {
    if (!validateInputs()) return;

    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success("Connexion réussie !");
        router.push(redirect);
        return;
      }

      // Signup
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName.trim() });

      await upsertAuthorInFirestore({
        uid: user.uid,
        email: user.email,
        fullName: fullName.trim(),
      });

      await saveUserToGitHub({
        uid: user.uid,
        email: user.email,
        fullName: fullName.trim(),
      });

      toast.success("Inscription réussie !");
      router.push(redirect);
    } catch (e: any) {
      console.error(e);
      const parsed = parseFirebaseError(e);
      setError(parsed);
      toast.error("Erreur : " + parsed);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Authentification Google
  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        await upsertAuthorInFirestore({
          uid: user.uid,
          email: user.email,
          fullName: user.displayName ?? "",
        });

        await saveUserToGitHub({
          uid: user.uid,
          email: user.email,
          fullName: user.displayName ?? "",
        });

        toast.success("Connexion réussie avec Google !");
        router.push(redirect);
      } catch (popupErr: any) {
        if (
          popupErr?.code === "auth/popup-blocked" ||
          popupErr?.code === "auth/popup-closed-by-user"
        ) {
          toast.info("Tentative via redirection...");
          await signInWithRedirect(auth, provider);
        } else {
          throw popupErr;
        }
      }
    } catch (e: any) {
      console.error(e);
      const parsed = parseFirebaseError(e);
      setError(parsed);
      toast.error("Erreur Google : " + parsed);
    } finally {
      setLoading(false);
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
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded mb-4 hover:bg-black transition disabled:opacity-60"
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
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading
            ? "Patientez..."
            : mode === "login"
            ? "Se connecter"
            : "S'inscrire"}
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

      {isForgotModalOpen && (
        <ForgotPasswordModal
          onClose={() => setIsForgotModalOpen(false)}
          email={email}
        />
      )}
    </div>
  );
}