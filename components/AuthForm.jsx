"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, User, Lock, ArrowRight, Loader2, ArrowLeft, Sparkles } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  // Détection du parrainage dans l'URL (?ref=...)
  useEffect(() => {
    const code = searchParams.get("ref");
    if (code) {
      setRefCode(code);
      setMode("register"); 
      toast.info("Lien de parrainage activé ! Profitez de votre bonus de bienvenue.");
    }
  }, [searchParams]);

  const checkAndNotifyBirthday = async (userData) => {
    if (!userData.birthday) return;
    const today = new Date();
    const birthDate = new Date(userData.birthday);

    if (today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth()) {
      try {
        await fetch("/api/github-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-notif",
            type: "anniversaire",
            targetEmail: userData.email,
            message: `Joyeux anniversaire ${userData.penName || userData.name} !`,
            link: "/account"
          })
        });
      } catch (e) { console.error("Notif error"); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailClean = formData.email.trim().toLowerCase();

      // Gestion du mot de passe oublié via l'API unifiée
      if (mode === "forgot") {
        const res = await fetch("/api/github-db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "reset-password",
            email: emailClean 
          })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Compte inconnu");
        toast.success(`Indice : ${result.hint}. Alerte de sécurité envoyée.`);
        setMode("login");
        return;
      }

      // Inscription ou Connexion via l'API unifiée
      const authAction = mode === "register" ? "register" : "login";
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authAction,
          name: formData.name,
          email: emailClean,
          password: formData.password,
          referralCode: refCode
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Identifiants invalides");

      const userData = result.user;
      
      // Bonus visuel si parrainage réussi
      if (mode === "register" && refCode) {
        toast.success("Bienvenue ! +200 Li crédités sur votre compte.");
      }

      await checkAndNotifyBirthday(userData);
      
      // 1. Stockage local pour l'UI
      localStorage.setItem("lisible_user", JSON.stringify(userData));
      
      // 2. Création du cookie de session
      document.cookie = "lisible_session=true; path=/; max-age=86400; SameSite=Lax";
      
      toast.success(`Heureux de vous voir, ${userData.penName || userData.name || "Auteur"}`);
      router.push("/dashboard");

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === "register" && refCode && (
        <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-500">
           <Sparkles className="text-teal-600" size={18}/>
           <p className="text-[10px] font-black text-teal-700 uppercase">Bonus de +200 Li activé !</p>
        </div>
      )}

      {mode === "register" && (
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Nom complet"
            required
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-teal-500/10 focus:border-teal-500 transition-all font-bold text-slate-900 shadow-inner"
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
          className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-teal-500/10 focus:border-teal-500 transition-all font-bold text-slate-900 shadow-inner"
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
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 pl-12 pr-4 outline-none focus:bg-white focus:border-teal-500/10 focus:border-teal-500 transition-all font-bold text-slate-900 shadow-inner"
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
            {mode === "login" ? "Accéder à l'Atelier" : mode === "register" ? "Devenir Auteur" : "Retrouver l'accès"}
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className="pt-4 text-center">
        {mode === "forgot" ? (
          <button 
            type="button" 
            onClick={() => setMode("login")}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all"
          >
            <ArrowLeft size={14} /> Revenir à la connexion
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all"
          >
            {mode === "login" ? "Créer un nouveau compte" : "Déjà membre ? Se connecter"}
          </button>
        )}
      </div>
    </form>
  );
}
