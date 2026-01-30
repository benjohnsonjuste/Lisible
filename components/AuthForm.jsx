"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Mail, User, Lock, ArrowRight, Loader2, KeyRound, ArrowLeft } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login", "register", "forgot"
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
      const emailClean = formData.email.trim().toLowerCase();

      // --- LOGIQUE RÉCUPÉRATION ---
      if (mode === "forgot") {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailClean })
        });
        const data = await res.json();
        
        if (res.ok) {
          toast.success(`Secret retrouvé : ${data.password}`, { duration: 8000 });
          setMode("login");
        } else {
          throw new Error(data.error || "Email inconnu");
        }
        return;
      }

      // --- LOGIQUE INSCRIPTION ---
      if (mode === "register") {
        if (!formData.name) throw new Error("Le nom est obligatoire");
        
        const res = await fetch("/api/register-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: emailClean,
            password: formData.password,
            joinedAt: new Date().toISOString()
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Échec de l'enregistrement");
        }
      }

      // --- SIMULATION CONNEXION / SESSION ---
      const userData = {
        name: mode === "register" ? formData.name : emailClean.split('@')[0],
        email: emailClean,
        isLoggedIn: true
      };

      localStorage.setItem("lisible_user", JSON.stringify(userData));
      toast.success(mode === "login" ? `Bienvenue, ${userData.name} !` : "Compte créé !");
      router.push("/dashboard");

    } catch (err) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* LOGO SECTION */}
      <div className="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-700">
        <img 
          src="/icon-192.png" 
          alt="Lisible Logo" 
          className="w-20 h-20 rounded-[2rem] shadow-2xl shadow-teal-500/20 mb-4 object-cover"
        />
        <h2 className="text-xl font-black italic tracking-tighter uppercase text-slate-900">
          Lisible
        </h2>
        <div className="h-1 w-8 bg-teal-500 rounded-full mt-1" />
      </div>

      {mode === "forgot" ? (
        /* --- RENDU MODE RÉCUPÉRATION --- */
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="space-y-2 text-center mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Récupération de compte
            </p>
            <p className="text-xs text-slate-500 font-medium italic">
              Entrez votre email pour retrouver votre accès.
            </p>
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email" placeholder="votre@email.com" required
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-teal-500/20 focus:bg-white outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18}/> : "Récupérer le secret"}
          </button>
          <button type="button" onClick={() => setMode("login")} className="w-full flex items-center justify-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-teal-600 transition-colors">
            <ArrowLeft size={14}/> Retour à la connexion
          </button>
        </form>
      ) : (
        /* --- RENDU LOGIN / REGISTER --- */
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-500">
          {mode === "register" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text" placeholder="Nom complet" required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-teal-500/20 focus:bg-white outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email" placeholder="Adresse e-mail" required
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-teal-500/20 focus:bg-white outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password" placeholder="Mot de passe" required
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-teal-500/20 focus:bg-white outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {mode === "login" && (
            <div className="flex justify-end pr-1">
              <button 
                type="button" onClick={() => setMode("forgot")}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-teal-600 transition-colors tracking-widest"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-teal-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-slate-200 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-all"
            >
              {mode === "login" ? "Nouveau ici ? S'inscrire gratuitement" : "Déjà membre ? Se connecter"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
