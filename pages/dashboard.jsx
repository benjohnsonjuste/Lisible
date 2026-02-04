"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, Send, TrendingUp, ArrowUpRight, FileText, UserCircle, 
  Download, Award, MessageCircle, Facebook, Instagram, Twitter, 
  Copy, UserPlus, Share2, Trash2, Edit3, BookOpen
} from "lucide-react";
import { toast } from "sonner";

export default function AuthorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTexts, setLoadingTexts] = useState(true);
  const [transfer, setTransfer] = useState({ email: "", amount: 1000 });
  const [copied, setCopied] = useState(false);

  const getRank = (sc) => {
    if (sc >= 1000) return { name: "Maître de Plume", color: "text-purple-400", bg: "bg-white/5", icon: "👑" };
    if (sc >= 200) return { name: "Plume d'Argent", color: "text-slate-300", bg: "bg-white/5", icon: "✨" };
    if (sc >= 50) return { name: "Plume de Bronze", color: "text-orange-400", bg: "bg-white/5", icon: "📜" };
    return { name: "Plume de Plomb", color: "text-slate-500", bg: "bg-white/5", icon: "🖋️" };
  };

  const fetchMyTexts = useCallback(async (email) => {
    setLoadingTexts(true);
    try {
      const res = await fetch(`/api/texts?authorEmail=${email.toLowerCase().trim()}`);
      if (res.ok) {
        const data = await res.json();
        setTexts(data);
      }
    } catch (e) { console.error("Erreur textes:", e); }
    finally { setLoadingTexts(false); }
  }, []);

  const fetchLatestData = useCallback(async (email, pass) => {
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pass }) });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("lisible_user", JSON.stringify(data.user));
        fetchMyTexts(data.user.email);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [fetchMyTexts]);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) {
      const u = JSON.parse(logged);
      fetchLatestData(u.email, u.password);
    } else { router.push("/login"); }
  }, [router, fetchLatestData]);

  const handleDeleteText = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement cette œuvre ?")) return;
    const tid = toast.loading("Suppression...");
    try {
      const res = await fetch(`/api/texts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Œuvre retirée de la bibliothèque", { id: tid });
        setTexts(texts.filter(t => t.id !== id));
      } else { toast.error("Erreur lors de la suppression", { id: tid }); }
    } catch (e) { toast.error("Échec de la connexion", { id: tid }); }
  };

  const copyRefLink = () => {
    const link = `${window.location.origin}/login?ref=${btoa(user.email)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien de parrainage copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransfer = async () => {
    const amount = Number(transfer.amount);
    if (amount < 1000) return toast.error("Le montant minimum d'envoi est de 1000 Li");
    if (user.wallet.balance < amount) return toast.error("Solde insuffisant");

    const tid = toast.loading("Transfert de Li en cours...");
    try {
      const res = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email, targetEmail: transfer.email, amount: amount, type: "transfer" }) });
      if (res.ok) { 
        toast.success(`Transfert de ${amount} Li réussi !`, { id: tid }); 
        fetchLatestData(user.email, user.password); 
      }
      else { toast.error("Destinataire introuvable", { id: tid }); }
    } catch (e) { toast.error("Erreur de connexion", { id: tid }); }
  };

  const handleUniversalShare = async () => {
    const shareData = {
      title: 'Lisible - La Belle Littéraire',
      text: `Découvrez mes écrits sur Lisible !`,
      url: `${window.location.origin}/auteur/${encodeURIComponent(user.email)}`
    };
    try {
      if (navigator.share) { await navigator.share(shareData); } 
      else { copyRefLink(); }
    } catch (err) { console.log(err); }
  };

  const downloadBadge = () => {
    toast.info("Génération du badge...");
    const link = document.createElement("a");
    link.href = `https://api.dicebear.com/7.x/shapes/svg?seed=${user?.email}`;
    link.download = `badge_lisible_${user?.penName}.svg`;
    link.click();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  const rank = getRank(user?.wallet?.balance || 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10 pb-20 font-sans animate-in fade-in duration-700">
      <header className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl gap-8 border border-white/5">
        <div className="text-center md:text-left">
          <div className={`inline-flex items-center gap-2 ${rank.color} ${rank.bg} px-4 py-2 rounded-2xl mb-4 border border-current/10`}>
             <span className="text-xl">{rank.icon}</span>
             <span className="text-[10px] font-black uppercase tracking-widest">{rank.name}</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-none">{user?.penName}</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-500 mt-2 italic">Auteur Certifié Lisible</p>
        </div>
        
        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-right min-w-[200px] shadow-inner">
          <p className="text-5xl font-black text-amber-400 tracking-tighter">{user?.wallet?.balance || 0} <span className="text-sm">Li</span></p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">Solde Disponible</p>
        </div>
      </header>

      {/* GESTION DES TEXTES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-2">
            <BookOpen size={16} /> Mes Œuvres ({texts.length})
          </h2>
          <button onClick={() => router.push("/publish")} className="text-[10px] font-black uppercase bg-teal-50 text-teal-600 px-4 py-2 rounded-xl hover:bg-teal-600 hover:text-white transition-all">
            Nouveau Manuscrit
          </button>
        </div>

        {loadingTexts ? (
          <div className="flex justify-center p-12 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <Loader2 className="animate-spin text-slate-300" />
          </div>
        ) : texts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {texts.map((text) => (
              <div key={text.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="space-y-4">
                  <div className="h-40 bg-slate-50 rounded-[2rem] overflow-hidden relative">
                    {text.imageBase64 ? (
                      <img src={text.imageBase64} alt="" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><FileText size={40} /></div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button onClick={() => router.push(`/edit/${text.id}`)} className="p-2.5 bg-white/90 backdrop-blur shadow-sm rounded-xl text-slate-600 hover:text-teal-600 transition-colors"><Edit3 size={16}/></button>
                       <button onClick={() => handleDeleteText(text.id)} className="p-2.5 bg-white/90 backdrop-blur shadow-sm rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black italic text-slate-900 line-clamp-1">{text.title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(text.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-16 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium italic text-sm">Votre plume n'a pas encore laissé de trace...</p>
          </div>
        )}
      </section>

      {/* RESTE DU DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-900"><Send size={18} className="text-teal-600"/> Transférer des Li</h3>
          <div className="space-y-4">
            <input type="email" placeholder="Email destinataire" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold" onChange={(e) => setTransfer({...transfer, email: e.target.value})} />
            <input type="number" min="1000" placeholder="Montant (Min. 1000)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold" onChange={(e) => setTransfer({...transfer, amount: e.target.value})} />
            <button onClick={handleTransfer} className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-teal-600 transition-all text-[10px]">Confirmer l'envoi</button>
          </div>
        </div>

        <div className="bg-teal-50 p-8 rounded-[3rem] border border-teal-100 flex flex-col justify-between shadow-sm">
           <TrendingUp className="text-teal-600 mb-6" size={30} />
           <div>
              <p className="text-3xl font-black italic text-slate-900 leading-none">Objectif Retrait</p>
              <div className="w-full bg-white h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-teal-500 h-full transition-all duration-1000" style={{ width: `${Math.min(((user?.wallet?.balance || 0) / 25000) * 100, 100)}%` }}></div>
              </div>
              <p className="text-[9px] font-black text-slate-400 mt-2 uppercase">Seuil : 25 000 Li</p>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
           <div className="relative">
              <Award size={50} className="text-amber-500 animate-pulse" />
              <button onClick={downloadBadge} className="absolute -bottom-2 -right-2 p-2 bg-slate-950 text-white rounded-full border-2 border-white hover:bg-teal-600 transition-all"><Download size={14}/></button>
           </div>
           <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => window.open(`https://wa.me/?text=Lisez moi sur Lisible !`)} className="p-3 bg-slate-50 rounded-xl hover:bg-[#25D366] hover:text-white transition-all"><MessageCircle size={18}/></button>
              <button onClick={() => window.open(`https://facebook.com/sharer/sharer.php?u=${window.location.origin}`)} className="p-3 bg-slate-50 rounded-xl hover:bg-[#1877F2] hover:text-white transition-all"><Facebook size={18}/></button>
              <button onClick={handleUniversalShare} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-teal-600 transition-all"><Share2 size={18}/></button>
           </div>
        </div>
      </div>
    </div>
  );
}
