"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Mail, User, Lock, ArrowRight } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!isLogin && !formData.name) {
        throw new Error("Le nom est obligatoire pour l'inscription");
      }

      const userData = {
        name: isLogin ? (formData.email.split('@')[0]) : formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        joinedAt: new Date().toISOString()
      };

      // --- LOGIQUE D'INSCRIPTION PERMANENTE ---
      if (!isLogin) {
        const res = await fetch("/api/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Échec de l'enregistrement sur le serveur");
        }
      }

      // --- SAUVEGARDE DE LA SESSION LOCALE (Pour /publish) ---
      localStorage.setItem("lisible_user", JSON.stringify({
        ...userData,
        isLoggedIn: true
      }));
      
      toast.success(isLogin ? `Heureux de vous revoir, ${userData.name} !` : "Compte créé et enregistré !");
      
      // Redirection vers la publication
      router.push("/dashboard");
    } catch (err) {
      console.error("Auth error:", err);
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <div className="relative">
          <User className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Nom complet (ex: Jean Valjean)"
            required
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </div>
      )}

      <div className="relative">
        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="email"
          placeholder="Adresse e-mail"
          required
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="password"
          placeholder="Mot de passe"
          required
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-100 disabled:opacity-50"
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            {isLogin ? "Se connecter" : "Créer mon compte"}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
          disabled={loading}
        >
          {isLogin ? "Pas encore de compte ? S'inscrire gratuitement" : "Déjà membre ? Se connecter"}
        </button>
      </div>
    </form>
  );
}
