"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Eye, Heart, MessageCircle, Loader2, Share2, 
  Trophy, Megaphone, ShieldCheck, Sparkles, 
  PenTool, Crown, Star, Cake, Gem
} from "lucide-react";
import { toast } from "sonner";

export default function Bibliotheque() {
  const [texts, setTexts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Emails exclus des classements hebdomadaires
  const excludedEmails = [
    "jb7management@gmail.com", 
    "adm.lablitteraire7@gmail.com", 
    "cmo.lablitteraire7@gmail.com"
  ];

  useEffect(() => {
    async function load() {
      try {
        const t = Date.now();
        // 1. Charger les textes
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${t}`);
        const files = await res.json();
        
        // 2. Charger les utilisateurs (pour les badges d'abonnés et anniversaires)
        const resU = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users?t=${t}`);
        const userFiles = await resU.json();

        if (Array.isArray(files) && Array.isArray(userFiles)) {
          const textPromises = files.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${t}`).then(r => r.json()));
          const userPromises = userFiles.filter(f => f.name.endsWith('.json')).map(f => fetch(`${f.download_url}?t=${t}`).then(r => r.json()));
          
          const [loadedTexts, loadedUsers] = await Promise.all([
            Promise.all(textPromises),
            Promise.all(userPromises)
          ]);

          setTexts(loadedTexts.sort((a, b) => new Date(b.date) - new Date(a.date)));
          setUsers(loadedUsers);
        }
      } catch (e) { 
        console.error("Erreur bibliothèque:", e); 
      } finally { setLoading(false); }
    }
    load();
  }, []);

  // --- LOGIQUE DES BADGES HEBDOMADAIRES (Dimanche) ---
  const getWeeklyChampions = () => {
    const now = new Date();
    const today = now.getDay(); // 0 = Dimanche
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - today);
    lastSunday.setHours(0, 0, 0, 0);

    const activeUsers = users.filter(u => !excludedEmails.includes(u.email?.toLowerCase()));

    // Encrier : Plus de textes cette semaine
    const encrier = [...activeUsers].sort((a, b) => {
      const countA = texts.filter(t => t.authorEmail === a.email && new Date(t.date) >= lastSunday).length;
      const countB = texts.filter(t => t.authorEmail === b.email && new Date(t.date) >= lastSunday).length;
      return countB - countA;
    })[0];

    // Élite : Plus de Li obtenus (totalCertified) cette semaine sur ses textes
    const elite = [...activeUsers].sort((a, b) => {
      const liA = texts.filter(t => t.authorEmail === a.email && new Date(t.date) >= lastSunday).reduce((acc, t) => acc + (t.totalCertified || 0), 0);
      const liB = texts.filter(t => t.authorEmail === b.email && new Date(t.date) >= lastSunday).reduce((acc, t) => acc + (t.totalCertified || 0), 0);
      return liB - liA;
    })[0];

    // VIP : Plus d'achats/envois (history type gift_sent ou purchase)
    const vip = [...activeUsers].sort((a, b) => {
      const spentA = a.wallet?.history?.filter(h => (h.type === "gift_sent" || h.type === "purchase") && new Date(h.date) >= lastSunday).length || 0;
      const spentB = b.wallet?.history?.filter(h => (h.type === "gift_sent" || h.type === "purchase") && new Date(h.date) >= lastSunday).length || 0;
      return spentB - spentA;
    })[0];

    return { encrierEmail: encrier?.email, eliteEmail: elite?.email, vipEmail: vip?.email };
  };

  const champions = getWeeklyChampions();

  const handleShare = async (e, item) => {
    e.preventDefault(); 
    e.stopPropagation();
    const url = `${window.location.origin}/texts/${item.id}`;
    try {
      if (navigator.share) { 
        await navigator.share({ title: item.title, url }); 
      } else { 
        await navigator.clipboard.writeText(url); 
        toast.success("Lien de l'œuvre copié !"); 
      }
    } catch (err) { 
      if (err.name !== "AbortError") toast.error("Erreur de partage"); 
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4">
      <Loader2 className="animate-spin text-teal-600" size={40}/>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronisation...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid gap-10 md:grid-cols-2">
      {texts.map((item) => {
        const email = item.authorEmail?.toLowerCase();
        const author = users.find(u => u.email?.toLowerCase() === email);
        const subCount = author?.subscribersCount || author?.subscribers?.length || 0;
        
        // Paliers Abonnés
        const isBronze = subCount >= 250 && subCount < 1000;
        const isArgent = subCount >= 1000 && subCount < 3000;
        const isOr = subCount >= 3000 && subCount < 5000;
        const isDiamant = subCount >= 5000;

        // Annonce & Concours
        const isAnnonce = email === "adm.lablitteraire7@gmail.com" || email === "cmo.lablitteraire7@gmail.com";
        const isConcours = item.isConcours === true || item.isConcours === "true";
        
        // Anniversaire (Aujourd'hui)
        const todayStr = new Date().toISOString().slice(5, 10); // "MM-DD"
        const isBirthday = author?.birthDate && author.birthDate.slice(5, 10) === todayStr;

        const certifiedCount = item.totalCertified || 0;

        return (
          <Link href={`/texts/${item.id}`} key={item.id} className="group relative">
            <div className={`bg-white rounded-[3.5rem] overflow-hidden border transition-all duration-500 h-full flex flex-col relative ${
              isConcours ? 'border-teal-200 shadow-2xl' : isAnnonce ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100 shadow-xl'
            }`}>
              
              <div className="h-64 bg-slate-100 relative overflow-hidden">
                {item.imageBase64 ? (
                  <img src={item.imageBase64} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black italic text-4xl text-slate-200 bg-slate-50">LISIBLE.</div>
                )}

                {/* BADGES FLOTTANTS */}
                <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-20 max-w-[80%]">
                    {isAnnonce && (
                        <div className="bg-amber-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                            <Megaphone size={12} /> <span className="text-[8px] font-black uppercase">Annonce</span>
                        </div>
                    )}
                    {isConcours && (
                        <div className="bg-teal-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                            <Trophy size={12} /> <span className="text-[8px] font-black uppercase">Battle</span>
                        </div>
                    )}
                    {email === "jb7management@gmail.com" && (
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-slate-700">
                            <ShieldCheck size={12} className="text-teal-400" /> <span className="text-[8px] font-black uppercase">PGD</span>
                        </div>
                    )}
                    {isBirthday && (
                        <div className="bg-rose-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg animate-bounce">
                            <Cake size={12} /> <span className="text-[8px] font-black uppercase">Joyeux anniversaire à moi</span>
                        </div>
                    )}
                    {/* HEBDO */}
                    {champions.encrierEmail === email && (
                        <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                            <PenTool size={12} /> <span className="text-[8px] font-black uppercase">Encrier</span>
                        </div>
                    )}
                    {champions.eliteEmail === email && (
                        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                            <Star size={12} /> <span className="text-[8px] font-black uppercase">Élite</span>
                        </div>
                    )}
                    {champions.vipEmail === email && (
                        <div className="bg-purple-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg">
                            <Gem size={12} /> <span className="text-[8px] font-black uppercase">VIP</span>
                        </div>
                    )}
                </div>

                <button onClick={(e) => handleShare(e, item)} className="absolute top-6 right-6 p-3 bg-white/90 rounded-2xl shadow-xl z-20">
                  <Share2 size={18} />
                </button>
              </div>

              <div className="p-8 flex-grow flex flex-col">
                <h2 className={`text-3xl font-black italic mb-4 tracking-tighter leading-none ${isAnnonce ? 'text-amber-900' : 'text-slate-900'}`}>{item.title}</h2>
                
                <div className="mb-6 flex flex-wrap gap-2">
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-teal-50 border-teal-100 text-teal-600">
                      <Sparkles size={12} />
                      <span className="text-[9px] font-black uppercase">{certifiedCount} Li gagnés</span>
                   </div>
                   {/* PALIERS ABONNÉS */}
                   {isBronze && <div className="px-3 py-1 rounded-full bg-[#CD7F32] text-white text-[8px] font-black uppercase">Compte Bronze</div>}
                   {isArgent && <div className="px-3 py-1 rounded-full bg-[#C0C0C0] text-slate-800 text-[8px] font-black uppercase">Compte Argent</div>}
                   {isOr && <div className="px-3 py-1 rounded-full bg-[#FFD700] text-slate-900 text-[8px] font-black uppercase">Compte Or</div>}
                   {isDiamant && <div className="px-3 py-1 rounded-full bg-cyan-400 text-white text-[8px] font-black uppercase shadow-[0_0_10px_rgba(34,211,238,0.5)]">Compte Diamant</div>}
                </div>

                <p className="text-slate-500 line-clamp-3 font-serif italic mb-10 leading-relaxed text-lg">{item.content}</p>

                <div className="flex items-center justify-between pt-8 border-t border-slate-50 mt-auto">
                  <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">@{item.authorName}</span>
                  <div className="flex gap-4 text-slate-400 font-black text-[11px]">
                    <span className="flex items-center gap-1.5"><Eye size={14}/> {item.views || 0}</span>
                    <span className="flex items-center gap-1.5 text-rose-500"><Heart size={14} fill={item.totalLikes > 0 ? "currentColor" : "none"}/> {item.totalLikes || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
