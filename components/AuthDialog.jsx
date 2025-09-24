// components/AuthDialog.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { db } from "@/firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function AuthDialog({ type = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  // Connexion ou Inscription via email/password
  const handleEmail = async () => {
    try {
      let userCredential;
      if (type === "login") {
        // Connexion
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Inscription
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Créer un document Firestore pour le nouvel auteur
        await setDoc(doc(db, "authors", userCredential.user.uid), {
          email: email,
          followers: 0,
          views: 0,
          createdAt: new Date(),
        });
      }

      // Rediriger vers le dashboard après succès
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  // Connexion avec Google
  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      if (type === "register") {
        // Créer un auteur s'il n'existe pas déjà
        await setDoc(doc(db, "authors", result.user.uid), {
          email: result.user.email,
          followers: 0,
          views: 0,
          createdAt: new Date(),
        });
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow w-96 mx-auto my-10">
      <h1 className="text-xl font-bold mb-4">
        {type === "login" ? "Connexion" : "Inscription"}
      </h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        onClick={handleGoogle}
        className="w-full bg-red-500 text-white py-2 rounded mb-4"
      >
        Continuer avec Google
      </button>

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
        className="w-full border p-2 rounded mb-2"
      />

      <button
        onClick={handleEmail}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {type === "login" ? "Se connecter" : "S'inscrire"}
      </button>
    </div>
  );
}