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
      // Simulation d'une attente réseau
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!isLogin && !formData.name) {
        throw new Error("Le nom est obligatoire pour l'inscription");
      }

      // SAUVEGARDE DE LA SESSION LOCALE
      const userData = {
        name: isLogin ? (formData.email.split('@')[0]) : formData.name, // Nom par défaut si login
        email: formData.email,
        isLoggedIn: true,
        joinedAt: new Date().toISOString()
      };

      localStorage.setItem("lisible_user", JSON.stringify(userData));
      
      toast.success(isLogin ? "Heureux de vous revoir !" : "Bienvenue parmi nous !");
      
      // Redirection vers la page de publication
      router.push("/publish");
    } catch (err) {
      toast.error(err.message);
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
            placeholder="Nom complet"
            required
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      )}

      <div className="relative">
        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="email"
          placeholder="Adresse e-mail"
          required
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="password"
          placeholder="Mot de passe"
          required
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-100"
      >
        {loading ? "Connexion..." : isLogin ? "Se connecter" : "Créer mon compte"}
        {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
      </button>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà inscrit ? Se connecter"}
        </button>
      </div>
    </form>
  );
}
