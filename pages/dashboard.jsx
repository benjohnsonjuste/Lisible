"use client";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { 
  Loader2, Send, ArrowUpRight, FileText, UserCircle, 
  Download, Award, Twitter, Facebook, 
  MessageCircle, Wallet, TrendingUp, ShieldCheck, 
  Sparkles, Share2, Bell, Users, BarChart3, 
  CheckCircle2, Settings, Edit3, Trash2, BookOpen, Lock
} from "lucide-react";
import { toast } from "sonner";
import { formatLi } from "@/lib/utils";

export default function AuthorDashboard() {
  const router = useRouter();
  const badgeRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [works, setWorks] = useState([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [metrics, setMetrics] = useState({ followers: 0, views: 0, totalCertified: 0 });

  const ADMIN_EMAILS = [
    "adm.lablitteraire7@gmail.com",
    "robergeaurodley97@gmail.com",
    "cmo.lablitteraire7@gmail.com",
    "jb7management@gmail.com",
    "woolsleypierre01@gmail.com",
    "jeanpierreborlhaïniedarha@gmail.com"
  ];

  const fetchLatestData = useCallback(async (email) => {
    try {
      // 1. Récupération des statistiques consolidées via l'API User-Stats
      const statsRes = await fetch(`/api/user-stats?email=${email}`);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        
        setMetrics({
          followers: statsData.subscribers || 0,
          views: statsData.totalViews || 0,
          totalCertified: statsData.totalCertified || 0
        });

        // Mise à jour du solde Li dans l'état local et localStorage
        setUser(prev => {
          const updated = {
            ...prev,
            wallet: { ...prev?.wallet, balance: statsData.liBalance },
            stats: { ...prev?.stats, subscribers: statsData.subscribers }
          };
          localStorage.setItem("lisible_user", JSON.stringify(updated));
          return updated;
        });
      }

      // 2. Récupération des œuvres (via l'index global pour assurer l'historique)
      const indexRes = await fetch(`/api/texts?limit=1000`);
      if (indexRes.ok) {
        const indexData = await indexRes.json();
        const myWorks = (indexData.data || []).filter(work => 
          work.authorEmail?.toLowerCase().trim() === email.toLowerCase().trim()
        );
        setWorks(myWorks);
      }

    } catch (e) { 
        console.error("Erreur sync dashboard:", e); 
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    
    const logged = localStorage.getItem("lisible_user");
    if (logged) {
      const u = JSON.parse(logged);
      setUser(u);
      fetchLatestData(u.email);
    } else { router.push("/login"); }
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [router, fetchLatestData]);

  const handleDeleteWork = async (workId) => {
    if(!confirm("Supprimer définitivement cette œuvre ?")) return;
    const tid = toast.loading("Vérification et suppression...");
    try {
      const res = await fetch(`/api/works/${workId}`, { 
        method: "DELETE",
        headers: { "x-user-email": user.email }
      });
      if (res.ok) {
        setWorks(works.filter(w => w.id !== workId));
        toast.success("Œuvre supprimée", { id: tid });
      } else { 
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la suppression", { id: tid }); 
      }
    } catch (e) { toast.error("Serveur indisponible", { id: tid }); }
  };

  const handleDownloadBadge = () => {
    const svg = badgeRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `Lisible_Badge_${user?.penName}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("Badge certifié téléchargé !");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleUniversalShare = async () => {
    const authorEmail = user?.email?.toLowerCase().trim() || "";
    const shareData = {
      title: "Lisible - Catalogue d'Auteur",
      text: `Découvrez le catalogue d'œuvres de ${user?.penName} sur Lisible !`,
      url: `${window.location.origin}/auteur/${authorEmail}`
    };
    try {
      if (navigator.share) { await navigator.share(shareData); } 
      else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Lien du catalogue copié !");
      }
    } catch (err) { console.log("Erreur de partage"); }
  };

  const nameParts = useMemo(() => {
    const name = user?.penName || "Plume";
    if (name.length > 15 && name.includes(" ")) {
      const parts = name.split(" ");
      const mid = Math.ceil(parts.length / 2);
      return [parts.slice(0, mid).join(" "), parts.slice(mid).join(" ")];
    }
    return [name, ""];
  }, [user?.penName]);

  if (loading || !user) return <div className="h-screen flex items-center justify-center bg-[#FCFBF9] dark:bg-slate-950"><Loader2 className="animate-spin text-teal-600" /></div>;

  const isStaff = ADMIN_EMAILS.includes(user?.email?.toLowerCase().trim());

  return (
    <div className="min-h-screen selection:bg-teal-100 font-sans bg-[#FCFBF9] dark:bg-slate-950">
      <Head><title>Tableau de bord | {user.penName}</title></Head>

      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-teal-600/20">
        <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12 sm:py-20">
        
        <header className="mb-16">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-[1.5rem] ${isStaff ? 'bg-slate-900' : 'bg-teal-600'} flex items-center justify-center text-white shadow-xl text-2xl rotate-3`}>
                {isStaff ? <ShieldCheck /> : <Sparkles />}
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isStaff ? 'text-slate-500' : 'text-teal-600'}`}>{isStaff ? 'Administration' : 'Auteur Certifié'}</p>
                <h1 className="text-3xl font-serif font-black italic dark:text-white">{user?.penName}</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push("/account")} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group transition-all hover:border-teal-500">
                <Settings size={20} className="text-slate-400 group-hover:text-teal-600" />
              </button>
              <button onClick={() => router.push("/notifications")} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                <Bell size={20} className="text-slate-400 group-hover:text-teal-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
            </div>
          </div>

          {!isStaff && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Lectures</p>
                <p className="text-lg font-serif font-bold dark:text-white">{metrics.views}</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-3xl border border-white/20 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Abonnés</p>
                <p className="text-lg font-serif font-bold dark:text-white">{metrics.followers}</p>
              </div>
            </div>
          )}

          {!isStaff && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Solde de Plume</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif font-black italic text-slate-900 dark:text-white">{formatLi(user?.wallet?.balance || 0)}</span>
                  <span className="text-teal-600 font-black text-xs uppercase">Li</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-teal-600 mb-1 flex items-center gap-1 justify-end"><TrendingUp size={12}/> Valeur</p>
                <p className="font-bold text-slate-900 dark:text-slate-300">{( (user?.wallet?.balance || 0) * 0.0002).toFixed(2)} USD</p>
              </div>
            </div>
          )}
        </header>

        <section className="space-y-12">
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => router.push("/publish")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-teal-500 transition-all group shadow-sm">
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 w-fit rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300">Nouvelle Œuvre</span>
            </button>
            <button onClick={() => router.push("/communaute")} className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-slate-900 dark:hover:border-white transition-all group shadow-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 w-fit rounded-2xl group-hover:bg-slate-900 dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-300">Communauté</span>
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
              <BookOpen size={14} /> Mes publications ({works.length})
            </h3>
            <div className="grid gap-3">
              {works.length > 0 ? works.map((work) => (
                <div key={work.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-lg dark:text-white line-clamp-1">{work.title}</span>
                    <span className="text-[9px] font-black uppercase text-slate-400">{work.genre || work.category} {!isStaff && `• ${work.views || 0} vues`}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/edit/${work.id}`)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-teal-600 transition-all">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDeleteWork(work.id)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:text-red-500 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-[2rem]">
                  <p className="text-[10px] font-black uppercase text-slate-300">Aucun texte publié pour le moment</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-white/5 relative overflow-hidden opacity-60 grayscale-[0.5]">
            <div className="absolute inset-0 bg-slate-900/40 z-20 flex flex-col items-center justify-center backdrop-blur-[2px]">
               <Lock className="text-teal-500 mb-2" size={32} />
               <p className="text-[10px] font-black uppercase tracking-widest text-white">Service en maintenance</p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Send size={80} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2 text-teal-400">
              <Wallet size={14} /> Transfert de jetons Li
            </h3>
            <div className="space-y-4 relative z-10 pointer-events-none">
              <input type="email" disabled placeholder="Email destinataire" className="w-full p-4 bg-white/10 rounded-2xl border-none text-sm placeholder:text-white/30 outline-none" />
              <input type="number" disabled placeholder="Montant (Min. 1000)" className="w-full p-4 bg-white/10 rounded-2xl border-none text-sm placeholder:text-white/30 outline-none" />
              <button disabled className="w-full bg-slate-700 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Indisponible</button>
            </div>
          </div>

          {!isStaff && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-end mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objectif Retrait</p>
                <p className="text-[10px] font-black text-teal-600">25 000 Li</p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full transition-all duration-1000" style={{ width: `${Math.min(((user?.wallet?.balance || 0) / 25000) * 100, 100)}%` }}></div>
              </div>
              <p className="mt-3 text-[9px] font-bold text-slate-400 uppercase text-center">{Math.floor(((user?.wallet?.balance || 0) / 25000) * 100)}% complété</p>
            </div>
          )}

          <div className="flex flex-col items-center text-center p-8">
            <div className="hidden">
              <svg ref={badgeRef} width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#0f172a', stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#1e293b', stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <rect width="1024" height="1024" fill="url(#grad)"/>
                <rect x="50" y="50" width="924" height="924" fill="none" stroke="#14b8a6" strokeWidth="15"/>
                <text x="512" y="380" fontFamily="sans-serif" fontSize="30" fontWeight="900" fill="#14b8a6" textAnchor="middle" style={{letterSpacing: '20px'}}>COMPTE OFFICIEL</text>
                {nameParts[1] ? (
                  <>
                    <text x="512" y="520" fontFamily="serif" fontSize="90" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{nameParts[0]}</text>
                    <text x="512" y="620" fontFamily="serif" fontSize="90" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{nameParts[1]}</text>
                  </>
                ) : (
                  <text x="512" y="550" fontFamily="serif" fontSize="100" fontWeight="900" fontStyle="italic" fill="white" textAnchor="middle">{nameParts[0]}</text>
                )}
                <text x="512" y="750" fontFamily="sans-serif" fontSize="35" fontWeight="bold" fill="#fbbf24" textAnchor="middle" style={{letterSpacing: '6px'}}>lisible.biz</text>
                <circle cx="512" cy="850" r="40" fill="#14b8a6" />
                <text x="512" y="865" fontFamily="sans-serif" fontSize="40" fill="white" textAnchor="middle">✓</text>
              </svg>
            </div>

            <div className="mb-6">
               <CheckCircle2 size={48} className="text-teal-600 animate-pulse" />
            </div>

            <div className="flex gap-4">
               <button onClick={handleUniversalShare} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:text-teal-600 transition-colors shadow-sm"><Share2 size={20} /></button>
               <button onClick={handleDownloadBadge} className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                 <Download size={16} /> Télécharger
               </button>
            </div>
          </div>
        </section>

        <footer className="mt-24 border-t border-slate-100 dark:border-slate-900 pt-8 flex items-center justify-between">
           <div className="flex items-center gap-2 text-slate-300 text-[9px] font-black uppercase tracking-widest">
             <ShieldCheck size={14} /> Compte sécurisé
           </div>
           <p className="text-[9px] font-black text-slate-400 uppercase italic">Compte Officiel Lisible</p>
        </footer>
      </div>
    </div>
  );
}
