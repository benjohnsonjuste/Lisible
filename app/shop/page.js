"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Coins, ArrowLeft, ExternalLink } from "lucide-react";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetAuthor = searchParams.get("for");
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));

    // Simulation de retour de paiement (si PayPal redirige vers /shop?status=success)
    const status = searchParams.get("status");
    const packId = searchParams.get("pack");
    if (status === "success" && packId) {
      const pack = packs.find(p => p.id === packId);
      if (pack) handlePurchaseSuccess(pack);
    }
  }, [searchParams]);

  const packs = [
    { 
      id: "p1", 
      name: "Pack Curieux", 
      amount: 4000, 
      price: "2.00", 
      icon: "🌱",
      link: "https://www.paypal.com/ncp/payment/KJK2WVTN6GHUY" 
    },
    { 
      id: "p2", 
      name: "Pack Mécène", 
      amount: 10000, 
      price: "4.50", 
      icon: "✨",
      link: "https://www.paypal.com/ncp/payment/XS2UPYWEAQMHY"
    },
    { 
      id: "p3", 
      name: "Pack Fondateur", 
      amount: 25000, 
      price: "10.00", 
      icon: "🏆",
      link: "https://www.paypal.com/ncp/payment/AEQEBDN2XMMNY"
    }
  ];

  const handlePurchaseSuccess = async (pack) => {
    const recipient = targetAuthor || user?.email;
    if (!recipient) return;
    
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_li",
          userEmail: recipient,
          amount: pack.amount,
          metadata: { source: "paypal_link", packId: pack.id, buyer: user?.email }
        })
      });

      if (res.ok) {
        if (!targetAuthor && user) {
          const updatedUser = { ...user, li: (user.li || 0) + pack.amount };
          localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        toast.success("Transaction validée ! Vos Li sont arrivés.");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (e) {
      toast.error("Erreur de synchronisation avec la banque.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <header className="flex justify-between items-center mb-16">
        <button onClick={() => router.back()} className="p-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:text-teal-600 transition-all">
          <ArrowLeft size={20}/>
        </button>
        <div className="text-center">
            <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">Banque de Li</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Réserve monétaire {targetAuthor && `pour ${targetAuthor}`}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border-2 border-teal-50 px-5 py-2.5 rounded-2xl text-teal-600 font-black">
           <Coins size={18} className="animate-bounce" /> 
           <span className="text-sm tracking-tight">{user?.li || 0}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packs.map(pack => (
          <div key={pack.id} className="bg-white border border-slate-100 p-10 rounded-[3.5rem] hover:shadow-xl transition-all flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="text-4xl mb-6">{pack.icon}</div>
              <h3 className="font-black italic text-xl text-slate-900 mb-1">{pack.name}</h3>
              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">{pack.amount.toLocaleString()}</span>
                <span className="text-xs font-black text-teal-600 uppercase">Li</span>
              </div>
            </div>
            
            <a
              href={pack.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-teal-600 transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
            >
              Acheter {pack.price} CAD <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={32} /></div>}>
      <ShopContent />
    </Suspense>
  );
}
