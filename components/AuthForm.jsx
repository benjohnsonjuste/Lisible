"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, User, Lock, ArrowRight, Loader2, ArrowLeft, Sparkles } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const checkAndNotifyBirthday = async (userData) => {
    if (!userData.birthday) return;
    const today = new Date();
    const birthDate = new Date(userData.birthday);

    if (today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth()) {
      await fetch("/api/create-notif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "anniversaire",
          targetEmail: userData.email,
          message: `Joyeux anniversaire ${userData.penName || userData.name} !`,
          link: "/account"
        })
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailClean = formData.email.trim().toLowerCase();

      if (mode === "forgot") {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailClean })
        });
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || "Compte inconnu");
        
        // Affichage de l'indice de sécurité récupéré
        toast.success(`Indice : ${result.hint}. Alerte de sécurité envoyée.`);
        setMode("login");
        return;
      }

      if (mode === "register") {
        const regRes = await fetch("/api/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: emailClean,
            password: formData.password
          })
        });
        if (!regRes.ok) {
          const err = await regRes.json();
          throw new Error(err.error || "Erreur d'inscription");
        }
      }

      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailClean,
          password: formData.password
        })
      });

      const result = await loginRes.json();
      if (!loginRes.ok) throw new Error(result.error || "Identifiants invalides");

      const userData = result.user;
      await checkAndNotifyBirthday(userData);
      
      localStorage.setItem("lisible_user", JSON.stringify(userData));
      toast.success(`Heureux de vous voir, ${userData.penName || userData.name}`);
      router.push("/dashboard");

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === "register" && (
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Nom complet"
             required
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-teal-100 transition-all font-medium text-slate-900"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      )}

      <div className="relative group">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
        <input
          type="email"
          placeholder="Email"
          required
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-teal-100 transition-all font-medium text-slate-900"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      {mode !== "forgot" && (
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
          <input
            type="password"
            placeholder="Mot de passe"
            required
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-teal-100 transition-all font-medium text-slate-900"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
      )}

      {mode === "login" && (
        <div className="flex justify-end px-2">
          <button 
            type="button" 
            onClick={() => setMode("forgot")}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors"
          >
            Mot de passe oublié ?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-teal-600 transition-all flex justify-center items-center gap-3 disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            {mode === "login" ? "Connecter" : mode === "register" ? "Créer mon compte" : "Retrouver l'accès"}
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className="pt-4 text-center">
        {mode === "forgot" ? (
          <button 
            type="button" 
            onClick={() => setMode("login")}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
          >
            <ArrowLeft size={14} /> Retour à la connexion
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all"
          >
            {mode === "login" ? "Pas encore de compte ? Créer le vôtre" : "Déjà membre ? Se connecter"}
          </button>
        )}
      </div>
    </form>
  );
}
