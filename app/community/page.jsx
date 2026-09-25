"use client";
import React, { useEffect, useState, useMemo } from "react";
import { 
  Users as UsersIcon, ArrowRight, Search, Loader2, 
  ShieldCheck, Crown, ChevronDown, TrendingUp, Star, Settings, 
  Briefcase, HeartHandshake, Feather, Mail, Gift, X, Flame
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import MessageModal from "@/components/MessageModal";
import CadeauLi from "@/components/CadeauLi"; // Import du composant cadeau
import FoyerHub from "@/components/foyer/FoyerHub";
import AdBanner, { useAdPlacements } from "@/components/AdBanner";

export default function CommunautePage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [mounted, setMounted] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [giftRecipient, setGiftRecipient] = useState(null); // État pour le cadeau
  const [onglet, setOnglet] = useState("cercle"); // "cercle" | "foyer"
  const adStrip = useAdPlacements("strip"); // bannière sous les onglets
  const adBox = useAdPlacements("box"); // bannière insérée dans la grille

  useEffect(() => {
    setMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "foyer" || params.get("onglet") === "foyer") setOnglet("foyer");
    } catch {}
    const loggedUser = localStorage.getItem("lisible_user");
    if (loggedUser) {
      try { setCurrentUser(JSON.parse(loggedUser)); } catch (e) {}
    }
    loadAuthorsData();
  }, []);

  async function loadAuthorsData() {
    try {
      // Liste des fichiers via l'API (1 sous-requête), puis téléchargement direct
      // de chaque profil (modèle de la page salon — contourne la limite de 50
      // sous-requêtes par invocation du Worker).
      const usersRes = await fetch(`/api/realtime-data?folder=users&mode=list`);
      const usersJson = await usersRes.json();
      const userFiles = Array.isArray(usersJson.files) ? usersJson.files : [];
      const rawUsers = (
        await Promise.all(
          userFiles.map(async (f) => {
            try {
              const r = await fetch(f.download_url);
              if (!r.ok) return null;
              return await r.json();
            } catch { return null; }
          })
        )
      ).filter(Boolean).flat();
      const allUsers = rawUsers.filter(u => u && (u.email || u.id));

      const libRes = await fetch(`/api/realtime-data?folder=publications&mode=list`);
      const libJson = await libRes.json();
      const pubFiles = Array.isArray(libJson.files) ? libJson.files : [];
      const publications = (
        await Promise.all(
          pubFiles.map(async (f) => {
            try {
              const r = await fetch(f.download_url);
              if (!r.ok) return null;
              return await r.json();
            } catch { return null; }
          })
        )
      ).filter(Boolean).flat();

      const community = allUsers.map(user => {
        const email = (user.email || "").toLowerCase().trim();
        const userPubs = publications.filter(p => (p.authorEmail || "").toLowerCase().trim() === email);
        
        return {
          ...user,
          name: user.name || user.fullName || "Plume Anonyme",
          email: email,
          image: user.profilePic || user.image || null,
          followers: Array.isArray(user.followers) ? user.followers : [],
          worksCount: userPubs.length,
          certified: userPubs.reduce((acc, p) => acc + Number(p.certified || 0), 0),
          likes: userPubs.reduce((acc, p) => acc + Number(p.likes || 0), 0),
          views: userPubs.reduce((acc, p) => acc + Number(p.views || 0), 0)
        };
      });

      setAuthors(community.sort((a, b) => (b.certified + b.likes) - (a.certified + a.likes)));
      
    } catch (e) { 
      console.error("Erreur de chargement:", e);
      toast.error("Le Cercle est inaccessible en ce moment."); 
    } finally { 
      setLoading(false); 
    }
  }

  const maxViews = useMemo(() => {
    return authors.length > 0 ? Math.max(...authors.map(a => a.views)) : 0;
  }, [authors]);

  const maxWorks = useMemo(() => {
    return authors.length > 0 ? Math.max(...authors.map(a => a.worksCount)) : 0;
  }, [authors]);

  const getBadges = (author) => {
    const b = [];
    const mail = author.email?.toLowerCase();
    
    const TEAM = {
      "adm.lablitteraire7@gmail.com": "Label Littéraire",
      "cmo.lablitteraire7@gmail.com": "Support Team",
      "robergeaurodley97@gmail.com": "Directeur Général",
      "jb7management@gmail.com": "Fondateur",
      "woolsleypierre01@gmail.com": "Directrice Artistique",
      "jeanpierreborlhaïniedarha@gmail.com": "Directrice Marketing"
    };

    if (TEAM[mail]) {
      b.push({ icon: <Settings size={10} />, label: TEAM[mail], color: "bg-rose-600 text-white" });
    }
    
    if (author.worksCount === maxWorks && maxWorks > 0) {
      b.push({ icon: <Feather size={10} />, label: "Légende", color: "bg-teal-600 text-white shadow-lg" });
    }

    if (author.views === maxViews && maxViews > 0) {
      b.push({ icon: <Crown size={10} className="animate-pulse" />, label: "Élite", color: "bg-slate-950 text-amber-400 border border-amber-400/20 shadow-lg" });
    }
    
    return b;
  };

  const handleFollow = async (targetEmail) => {
    if (!currentUser) return toast.error("Connectez-vous pour suivre cette plume");
    setSubmitting(targetEmail);
    try {
      const isFollowing = authors.find(a => a.email === targetEmail)?.followers?.includes(currentUser.email);
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow", userEmail: currentUser.email, targetEmail })
      });
      if (res.ok) {
        setAuthors(prev => prev.map(auth => auth.email === targetEmail ? { ...auth, followers: isFollowing ? auth.followers.filter(e => e !== currentUser.email) : [...auth.followers, currentUser.email] } : auth));
        toast.success(isFollowing ? "Désabonné" : "Abonné !");
      }
    } catch (err) { toast.error("Erreur de liaison."); }
    finally { setSubmitting(null); }
  };

  if (!mounted || loading) return <div className="min-h-screen bg-[#FCFBF9] flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  const filteredAuthors = authors.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 bg-[#FCFBF9] min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between mb-10 gap-8 items-end">
        <h1 className="text-8xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.75]">Cercle.</h1>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher un auteur..." 
            className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 shadow-xl outline-none focus:border-teal-500 transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </header>

      {/* Onglets : Le Cercle / Le Foyer */}
      <div className="flex gap-3 mb-12">
        <button
          onClick={() => setOnglet("cercle")}
          className={`flex items-center gap-2.5 px-7 py-4 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all ${onglet === "cercle" ? "bg-slate-950 text-white shadow-2xl" : "bg-white text-slate-500 border-2 border-slate-100 hover:border-teal-300 hover:text-teal-600"}`}
        >
          <UsersIcon size={17} /> Le Cercle
        </button>
        <button
          onClick={() => setOnglet("foyer")}
          className={`flex items-center gap-2.5 px-7 py-4 rounded-[1.75rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${onglet === "foyer" ? "bg-slate-950 text-white shadow-2xl" : "bg-white text-slate-500 border-2 border-slate-100 hover:border-orange-300 hover:text-orange-600"}`}
        >
          <Flame size={17} className={onglet === "foyer" ? "text-amber-400" : ""} /> Le Foyer
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">Nouveau</span>
        </button>
      </div>

      {/* Bannière publicitaire discrète (se replie si vide). */}
      {adStrip && <AdBanner placement={adStrip[0]} className="mb-12" />}

      {onglet === "foyer" ? (
        <FoyerHub authors={authors} />
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {filteredAuthors.slice(0, visibleCount).map((a, idx) => (
          <React.Fragment key={a.email}>
          <div className="group bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden transition-hover hover:border-teal-200">
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2 z-10">
              {getBadges(a).map((b, i) => (
                <div key={i} className={`${b.color} px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-1`}>{b.icon} {b.label}</div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
              <div className="w-32 h-32 rounded-[2.8rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                <img 
                  src={a.image || `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${a.email}`} 
                  className="w-full h-full object-cover" 
                  alt={a.name}
                />
              </div>
              <div className="grow space-y-4 text-center sm:text-left">
                <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-2">
                  {a.name} <ShieldCheck size={20} className="text-teal-500" />
                </h2>
                <div className="flex gap-3 justify-center sm:justify-start">
                    <div className="bg-rose-50 px-3 py-1.5 rounded-xl text-center border border-rose-100">
                      <span className="block text-[8px] font-black text-rose-600 uppercase">Lectures</span>
                      <span className="text-sm font-black text-rose-700">{a.views.toLocaleString()}</span>
                    </div>
                    <div className="bg-teal-50 px-3 py-1.5 rounded-xl text-center border border-teal-100">
                      <span className="block text-[8px] font-black text-teal-600 uppercase">Textes</span>
                      <span className="text-sm font-black text-teal-700">{a.worksCount}</span>
                    </div>
                </div>
                <div className="flex gap-2 justify-center sm:justify-start">
                  <button 
                    onClick={() => handleFollow(a.email)} 
                    className="px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-slate-950 text-white hover:bg-teal-600 transition-all min-w-[100px]"
                  >
                    {submitting === a.email ? <Loader2 className="animate-spin mx-auto" size={14} /> : (a.followers?.includes(currentUser?.email) ? "Abonné" : "Suivre")}
                  </button>
                  <Link 
                    href={`/author/${encodeURIComponent(a.email)}`} 
                    className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"
                  >
                    Profil <ArrowRight size={14} />
                  </Link>
                  <button 
                    onClick={() => currentUser ? setSelectedRecipient(a) : toast.error("Connectez-vous pour envoyer un message")}
                    className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center"
                  >
                    <Mail size={16} />
                  </button>
                  {/* BOUTON CADEAU */}
                  <button 
                    onClick={() => currentUser ? setGiftRecipient(a) : toast.error("Connectez-vous pour offrir des Li")}
                    className="px-4 py-3 bg-teal-50 text-teal-600 border border-teal-100 rounded-2xl hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center"
                  >
                    <Gift size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Bannière discrète insérée dans la grille tous les 8 auteurs. */}
          {(idx + 1) % 8 === 0 && adBox && (
            <div className="md:col-span-2">
              <AdBanner placement={adBox[0]} />
            </div>
          )}
          </React.Fragment>
        ))}
      </div>

      {filteredAuthors.length > visibleCount && (
        <button 
          onClick={() => setVisibleCount(v => v + 10)} 
          className="mt-20 mx-auto block px-12 py-5 bg-white border-2 border-slate-100 rounded-full font-black text-slate-900 shadow-xl hover:shadow-2xl hover:border-teal-500 transition-all uppercase text-[10px] tracking-widest"
        >
          Découvrir plus de plumes
        </button>
      )}

      {/* MODALE CADEAU */}
      {giftRecipient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setGiftRecipient(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-teal-400 transition-colors"
            >
              <X size={32} />
            </button>
            <CadeauLi />
          </div>
        </div>
      )}

      {selectedRecipient && (
        <MessageModal 
          isOpen={!!selectedRecipient} 
          onClose={() => setSelectedRecipient(null)} 
          recipient={selectedRecipient} 
          sender={currentUser} 
        />
      )}
      </>
      )}
    </div>
  );
}
