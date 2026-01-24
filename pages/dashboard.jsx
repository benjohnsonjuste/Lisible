"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuickActions from "@/components/QuickActions";
import { Sparkles, BookOpen, BarChart, Settings } from "lucide-react";
import Link from "next/link";

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      setUser(JSON.parse(loggedUser));
    }
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-40 text-teal-600">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-current mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-widest">Initialisation du studio...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] text-center shadow-2xl shadow-slate-100 border border-slate-50 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <Settings size={40} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-4 italic tracking-tighter">Accès restreint.</h1>
        <p className="text-slate-500 mb-10 font-medium leading-relaxed">
          Connectez-vous pour accéder à vos outils d'édition et statistiques.
        </p>
        <Link href="/login" className="block w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-teal-600 transition-all shadow-xl shadow-slate-200">
          SE CONNECTER
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-700">
      
      {/* SECTION BIENVENUE */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-slate-200">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-teal-400 mb-4">
            <Sparkles size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Studio Auteur</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic mb-2">
            Bonjour, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-400 font-medium max-w-sm">
            Prêt à enrichir le catalogue avec une nouvelle pépite littéraire ?
          </p>
        </div>

        <div className="flex gap-4 relative z-10">
          <StatMini label="Vues" value="1.2k" icon={<BarChart size={14}/>} />
          <StatMini label="Textes" value="4" icon={<BookOpen size={14}/>} />
        </div>

        {/* Décoration abstraite */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </header>

      {/* ACTIONS RAPIDES */}
      <section>
        <QuickActions />
      </section>

      {/* SECTION COMPLÉMENTAIRE (Suggestion) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <BookOpen size={16} className="text-teal-500" />
            Dernières publications
          </h3>
          <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm font-medium italic">Aucun texte récent.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            Conseil d'écriture
          </h3>
          <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100/50">
            <p className="text-slate-700 text-sm leading-relaxed font-serif italic">
              "Le premier jet de n'importe quoi est de la merde. L'important est de commencer." — Hemingway
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center pt-10">
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Lisible © 2026 • Plateforme sécurisée
         </p>
      </footer>
    </div>
  );
}

// Petit composant utilitaire pour les chiffres clés
function StatMini({ label, value, icon }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-5 py-4 rounded-3xl min-w-[100px] text-center">
      <div className="flex justify-center text-teal-400 mb-1">{icon}</div>
      <p className="text-xl font-black">{value}</p>
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
