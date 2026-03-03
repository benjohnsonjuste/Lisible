"use client";
import React, { useEffect, useState } from "react";
import { 
  Sword, ShieldCheck, Loader2, 
  ArrowLeft, Coins, UserPlus, Zap, Check, X, Sparkles 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import DuelRequests from "@/components/DuelRequests";

export default function DuelGestionPage() {
  const [user, setUser] = useState(null);
  const [followedAuthors, setFollowedAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    const logged = localStorage.getItem("lisible_user");
    if (!logged) return (window.location.href = "/login");
    const currentUser = JSON.parse(logged);

    try {
      // 1. Charger le profil frais de l'utilisateur
      const resUser = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(currentUser.email)}`);
      const userData = await resUser.json();
      if (userData.content) {
        setUser(userData.content);
        localStorage.setItem("lisible_user", JSON.stringify(userData.content));
      }

      // 2. Charger les auteurs pour pouvoir en défier un
      const resAuthors = await fetch(`/api/github-db?type=publications`);
      const authorsData = await resAuthors.json();
      
      const uniqueEmails = [...new Set(authorsData.content.map(p => p.authorEmail))];
      const profiles = await Promise.all(
        uniqueEmails
          .filter(email => email !== currentUser.email)
          .map(async (email) => {
            const r = await fetch(`/api/github-db?type=user&id=${encodeURIComponent(email)}`);
            const d = await r.json();
            return d.content;
          })
      );
      setFollowedAuthors(profiles.filter(p => p && p.status !== "deleted"));
    } catch (e) {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-rose-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <Link href="/club/duel" className="p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ma Bourse</p>
            <div className="flex items-center gap-2 justify-end text-rose-600 font-black text-xl">
              <Coins size={18} /> {user?.li || 0} Li
            </div>
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900">L'Antichambre.</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Gérez vos défis et lancez vos gants.</p>
        </div>

        {/* SECTION 1 : REQUÊTES REÇUES */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
              <Zap size={16} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Défis Reçus</h2>
          </div>
          
          {user?.duelRequests && user.duelRequests.length > 0 ? (
            <DuelRequests requests={user.duelRequests} currentUser={user} />
          ) : (
            <div className="bg-white p-10 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
              <p className="text-slate-400 italic text-sm">Personne n'a encore osé vous défier...</p>
            </div>
          )}
        </section>

        {/* SECTION 2 : LANCER UN DÉFI (LISTE DES AUTEURS) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center">
              <Sword size={16} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Lancer un gant (Entrée Libre)</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {followedAuthors.map((author) => (
              <div key={author.email} className="group bg-white p-4 rounded-3xl border border-slate-100 hover:border-teal-200 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src={author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.email}`} 
                    className="w-12 h-12 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all"
                    alt="avatar"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">{author.penName || author.name}</h4>
                    <div className="flex items-center gap-2">
                      <Sparkles size={10} className="text-teal-500" />
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Prêt pour le combat</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDuelClick(author)}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg shadow-slate-900/10"
                >
                  Défier
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );

  async function handleDuelClick(target) {
    const confirmDuel = confirm(`Voulez-vous vraiment défier ${target.penName || target.name} ?`);
    if (!confirmDuel) return;

    const toastId = toast.loading("Envoi du défi...");
    
    try {
      const res = await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "sendChallenge",
          senderEmail: user.email,
          senderName: user.penName || user.name,
          targetEmail: target.email
        })
      });

      if (res.ok) {
        toast.success("Gant jeté ! L'honneur est en jeu.", { id: toastId });
        window.location.reload();
      }
    } catch (e) {
      toast.error("Erreur lors de l'envoi", { id: toastId });
    }
  }
}
