"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, ChevronDown, TrendingUp, Star, Settings, 
  Briefcase, HeartHandshake, Feather, Sparkles, Sun, Mail, X, Send, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Head from 'next/head';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
};

let authorsCache = null;

export default function CommunautePage() {
  const [authors, setAuthors] = useState(authorsCache || []);
  const [loading, setLoading] = useState(!authorsCache);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [mounted, setMounted] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  useEffect(() => {
    setMounted(true);
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      try { setCurrentUser(JSON.parse(loggedUser)); } catch (e) {}
    }
    loadAuthorsData();
  }, []);

  async function loadAuthorsData() {
    try {
      const pubUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/publications`;
      const pubRes = await fetch(pubUrl);
      let libStats = {};

      if (pubRes.ok) {
        const pubFiles = await pubRes.json();
        const pubData = await Promise.all(
          pubFiles
            .filter(f => f.name.endsWith('.json'))
            .map(f => fetch(f.download_url).then(r => r.json()))
        );

        libStats = pubData.reduce((acc, pub) => {
          const email = pub.authorEmail?.toLowerCase().trim();
          if (!email) return acc;
          if (!acc[email]) acc[email] = { works: 0, views: 0 };
          acc[email].works += 1;
          acc[email].views += Number(pub.views || 0);
          return acc;
        }, {});
      }

      const userUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`;
      const userRes = await fetch(userUrl);
      if (!userRes.ok) throw new Error("Erreur fichiers users");
      
      const userFiles = await userRes.json();
      const authorProfiles = await Promise.all(
        userFiles
          .filter(file => file.name.endsWith('.json'))
          .map(async (file) => {
            try {
              const fileRes = await fetch(file.download_url);
              const userData = await fileRes.json();
              const email = userData.email?.toLowerCase().trim();
              const stats = libStats[email] || { works: 0, views: 0 };
              
              return {
                name: userData.name || userData.fullName || "Plume Anonyme",
                email: email,
                image: userData.profilePic || userData.image || null,
                followers: userData.followers || [],
                li: Number(userData.li || 0),
                worksCount: stats.works,
                views: stats.views,
                certified: userData.certified || 0
              };
            } catch (err) { return null; }
          })
      );

      const finalAuthors = authorProfiles.filter(Boolean).sort((a, b) => 
        (b.li + b.views + b.worksCount) - (a.li + a.views + a.worksCount)
      );

      authorsCache = finalAuthors;
      setAuthors(finalAuthors);
    } catch (e) { 
      console.error("Erreur globale:", e);
      if (!authorsCache) toast.error("Connexion au Cercle impossible."); 
    } finally { 
      setLoading(false); 
    }
  }

  const stats = useMemo(() => {
    if (authors.length === 0) return { maxViews: 0, maxWorks: 0, maxLi: 0 };
    return {
      maxViews: Math.max(...authors.map(a => a.views)),
      maxWorks: Math.max(...authors.map(a => a.worksCount)),
      maxLi: Math.max(...authors.map(a => a.li))
    };
  }, [authors]);

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase().trim();
    
    if (mail === "adm.lablitteraire7@gmail.com") b.push({ icon: <Settings size={10} />, label: "Label", color: "bg-rose-600 text-white" });
    if (mail === "woolsleypierre01@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Artistique", color: "bg-yellow-600 text-white" });
    if (mail === "jeanpierreborlhainiedarha@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Marketing", color: "bg-blue-600 text-white" });
    if (mail === "robergeaurodley97@gmail.com") b.push({ icon: <Settings size={10} />, label: "Dir. Général", color: "bg-green-600 text-white" });
    if (mail === "jb7management@gmail.com") b.push({ icon: <Crown size={10} />, label: "Fondateur", color: "bg-slate-900 text-amber-400" });
    if (mail === "cmo.lablitteraire7@gmail.com") b.push({ icon: <Crown size={10} />, label: "Support Team", color: "bg-orange-600 text-white" });
    
    if (author.views === stats.maxViews && stats.maxViews > 0) b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    if (author.worksCount === stats.maxWorks && stats.maxWorks > 2) b.push({ icon: <Sparkles size={10} />, label: "Pépite", color: "bg-teal-600 text-white shadow-lg" });
    if (author.li === stats.maxLi && stats.maxLi > 0) b.push({ icon: <Sun size={10} />, label: "Auréole", color: "bg-amber-400 text-slate-900 font-bold" });
    return b;
  };

  if (!mounted) return null;
  if (loading && authors.length === 0) return (
    <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center">
      <Loader2 className="animate-spin text-teal-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <Head><title>Cercle | Lisible</title></Head>
      <header className="flex flex-col lg:flex-row justify-between mb-24 gap-8">
        <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
        <div className="relative group w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une plume..." 
            className="w-full bg-white border-2 border-slate-50 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {authors
          .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, visibleCount)
          .map((a) => (
          <div key={a.email} className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden transition-all hover:shadow-2xl">
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
              {getBadges(a).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5`}>
                  {b.icon} {b.label}
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                <img 
                  src={a.image || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${a.email}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={a.name}
                  onError={(e) => e.target.src = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${a.email}`}
                />
              </div>
              <div className="grow space-y-4 text-center sm:text-left">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                  {a.name} 
                  {a.certified > 0 && <ShieldCheck size={20} className="text-teal-500" fill="currentColor" />}
                </h2>
                <div className="flex justify-center sm:justify-start gap-3">
                    <StatBadge label="Li" val={a.li} color="amber" />
                </div>
                <div className="flex gap-2 justify-center sm:justify-start">
                  <Link href={`/author/${a.email}`} className="px-8 py-3 bg-teal-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2">
                    Profil <ArrowRight size={14} />
                  </Link>
                  {currentUser && currentUser.email !== a.email && (
                    <button 
                      onClick={() => setSelectedAuthor(a)}
                      className="p-3 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl hover:bg-white hover:text-blue-600 hover:border-blue-100 transition-all"
                    >
                      <Mail size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {authors.length > visibleCount && (
        <div className="mt-20 text-center">
          <button onClick={() => setVisibleCount(v => v + 10)} className="px-12 py-6 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 shadow-xl transition-all">
            Découvrir plus de plumes
          </button>
        </div>
      )}

      {selectedAuthor && (
        <MessageModal 
          isOpen={!!selectedAuthor} 
          onClose={() => setSelectedAuthor(null)}
          sender={currentUser} 
          recipient={selectedAuthor}
        />
      )}
    </div>
  );
}

function MessageModal({ isOpen, onClose, sender, recipient }) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (message.length < 5) return toast.error("Message trop court.");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportData: {
            textId: "DM", 
            textTitle: sender.name || sender.fullName || "Un membre", 
            reporterEmail: sender.email,               
            targetEmail: recipient.email,             
            reason: "DIRECT_MESSAGE",
            details: message,
            date: new Date().toLocaleString("fr-FR")
          }
        }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => { onClose(); setIsSuccess(false); setMessage(""); }, 2500);
      }
    } catch (error) { toast.error("Erreur d'envoi."); } 
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 overflow-hidden">
        {!isSuccess ? (
          <form onSubmit={handleSend} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-black italic text-xl tracking-tight">Message <span className="text-blue-600">privé.</span></h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">À : {recipient.name}</p>
                  </div>
               </div>
               <button type="button" onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><X size={20}/></button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Écrivez à ${recipient.name}...`}
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[150px] resize-none transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting || !message}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /><span>Envoyer le message</span></>}
            </button>
          </form>
        ) : (
          <div className="py-10 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h4 className="font-black text-xl text-slate-900 mb-2">Message transmis !</h4>
            <p className="text-slate-400 text-sm">{recipient.name} recevra une notification par e-mail.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, val, color }) {
  const styles = {
    rose: "bg-rose-50/50 text-rose-600 border-rose-100",
    teal: "bg-teal-50/50 text-teal-600 border-teal-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100"
  };
  return (
    <div className={`px-3 py-1.5 rounded-xl text-center border ${styles[color]}`}>
      <span className="block text-[8px] font-black uppercase opacity-70">{label}</span>
      <span className="text-sm font-black">{val.toLocaleString()}</span>
    </div>
  );
}
