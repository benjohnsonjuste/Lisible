// pages/register.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth, db, createUserWithEmailAndPassword, updateProfile, setDoc, doc } from "../firebaseConfig";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await setDoc(doc(db, "users", userCredential.user.uid), { name, email });
      router.push("/dashboard");
    } catch (err) {
      alert("Erreur : " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-700">
          S'inscrire
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <p className="text-sm text-center text-gray-600">
          Déjà inscrit ?{" "}
          <Link href="/login">
            <a className="text-blue-600 hover:text-blue-700">Se connecter</a>
          </Link>
        </p>
      </div>
    </div>
  );
}