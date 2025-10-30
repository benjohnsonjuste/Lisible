"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [penName, setPenName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (!isLogin && (!firstName.trim() || !lastName.trim()))) {
      toast.error("Veuillez remplir tous les champs requis.");
      return;
    }

    setLoading(true);

    try {
      const payload = isLogin
        ? { email: email.trim(), password: password.trim() }
        : {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            penName: penName.trim(),
            email: email.trim(),
            password: password.trim(),
            avatar: "avatar.png", // avatar par défaut
          };

      const res = await fetch(`/api/${isLogin ? "login-user" : "register-user"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erreur Auth");
      }

      toast.success(isLogin ? "Connexion réussie !" : "Inscription réussie !");
      router.push("/profile"); // redirection vers page profil ou dashboard
    } catch (err) {
      console.error("Erreur Auth:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold text-center">
        {isLogin ? "Connexion" : "Inscription"}
      </h2>

      {!isLogin && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Prénom *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nom de plume</label>
            <input
              type="text"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Adresse électronique *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe *</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {loading ? "En cours..." : isLogin ? "Se connecter" : "S'inscrire"}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isLogin ? "Pas encore inscrit ?" : "Déjà inscrit ?"}{" "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 font-semibold hover:underline"
        >
          {isLogin ? "Inscrivez-vous" : "Connectez-vous"}
        </button>
      </p>
    </div>
  );
}