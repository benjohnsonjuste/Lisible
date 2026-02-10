"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Coins, ArrowLeft, Heart, Sparkles } from "lucide-react";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetAuthor = searchParams.get("for"); // Email de l'auteur si mode mécénat
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));
  }, []);

  const packs = [
    { id: "p1", name: "Pack Curieux", amount: 4000, price: 2, icon: "🌱" },
    { id: "p2", name: "Pack Mécène", amount: 10000, price: 4.5, icon: "✨" },
    { id: "p3", name: "Pack Fondateur", amount: 25000, price: 10, icon: "🏆" }
  ];

  const handlePurchase = async (pack) => {
    if (!user) return toast.error("Veuillez vous connecter pour accéder à la banque.");
    
    const recipient = targetAuthor || user.email;
    setLoading(pack.id);

    try {
      // Appel à l'API centralisée pour créditer les Li
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_li",
          userEmail: recipient,
          amount: pack.amount,
          metadata: {
            source: "shop",
            packId: pack.id,
            buyer: user.email
          }
        })
      });

      if (res.ok) {
        // Si l'utilisateur achète pour lui-même, on met à jour son profil local
        if (!targetAuthor) {
          const updatedUser = { ...user, li: (user.li || 0) + pack.amount };
          localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }

        toast.success(targetAuthor ? `Don envoyé avec succès !` : "Votre bourse a été créditée !");
        
        // Notification à l'auteur si c'est un don
        if (targetAuthor) {
          fetch("/api/github-db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_notif",
              targetEmail: targetAuthor,
              type: "gift",
              title: "Mécénat reçu !",
              message: `${user.penName || "Une plume"} vous a offert un ${pack.name} (${pack.amount} Li).`
            })
          });
        }

        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        throw new Error("Transaction refusée");
      }
    } catch (e) { 
      toast.error("Erreur lors de la transaction avec le Grand Livre."); 
    } finally { 
      setLoading(null); 
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <header className="flex justify-between items-center mb-16">
        <button 
          onClick={() => router.back()} 
          className="p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:text-teal-600 transition-all"
        >
          <ArrowLeft size={20}/>
        </button>
        <div className="text-center">
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">Banque de Li</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Réserve monétaire de l'Atelier</p>
        </div>
        <div className="flex items-center gap-2 bg-white border-2 border-teal-50 px-5 py-2.5 rounded-2xl text-teal-600 font-black shadow-sm">
           <Coins size={18} className="animate-bounce" /> 
           <span className="text-sm tracking-tight">{user?.li || 0}</span>
        </div>
      </header>

      {targetAuthor && (
        <div className="bg-teal-900 text-white p-8 rounded-[3rem] mb-12 flex items-center justify-between shadow-2xl shadow-teal-900/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Heart fill="currentColor" size={16} className="text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Mode Mécénat</span>
            </div>
            <p className="text-xl font-bold tracking-tight italic">
              Vous offrez de l'énergie à <span className="text-teal-400">{targetAuthor}</span>
            </p>
          </div>
          <Sparkles className="absolute right-[-20px] top-[-20px] text-white/10 w-40 h-40 group-hover:rotate-12 transition-transform duration-1000" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packs.map(pack => (
          <div 
            key={pack.id} 
            className="bg-white border border-slate-100 p-10 rounded-[3.5rem] hover:shadow-2xl hover:shadow-slate-200 transition-all group relative overflow-hidden"
          >
            <div className="text-4xl mb-6">{pack.icon}</div>
            <h3 className="font-black italic text-xl text-slate-900 mb-1">{pack.name}</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-6">Crédit immédiat</p>
            
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{pack.amount.toLocaleString()}</span>
              <span className="text-xs font-black text-teal-600 uppercase">Li</span>
            </div>

            <button 
              onClick={() => handlePurchase(pack)}
              disabled={loading !== null}
              className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] group-hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
            >
              {loading === pack.id ? <Loader2 className="animate-spin mx-auto" size={18}/> : `Investir ${pack.price}€`}
            </button>
          </div>
        ))}
      </div>

      <footer className="mt-20 text-center">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed">
          Les Li acquis permettent de soutenir les plumes, de débloquer des récits premium et de participer aux concours.
        </p>
      </footer>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
