"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Coins, ArrowLeft, Heart } from "lucide-react";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetAuthor = searchParams.get("for");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));
  }, []);

  const packs = [
    { id: "p1", name: "Pack Curieux", amount: 4000, price: 2 },
    { id: "p2", name: "Pack Mécène", amount: 10000, price: 4.5 },
    { id: "p3", name: "Pack Fondateur", amount: 25000, price: 10 }
  ];

  const handlePurchase = async (pack) => {
    const buyer = user?.email;
    const recipient = targetAuthor || buyer;

    if (!recipient) return toast.error("Veuillez vous connecter.");
    
    setLoading(pack.id);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipient,
          amount: pack.amount,
          reason: targetAuthor ? `Don de Li par ${user?.penName || "Anonyme"}` : `Achat de ${pack.name}`,
          type: "purchase"
        })
      });

      if (res.ok) {
        toast.success(targetAuthor ? `Don envoyé à l'auteur !` : "Compte crédité !");
        router.push("/dashboard");
      }
    } catch (e) { toast.error("Erreur transaction"); }
    finally { setLoading(null); }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="flex justify-between items-center mb-12">
        <button onClick={() => router.back()} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-black italic tracking-tighter">Banque de Li</h1>
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full text-amber-700 font-black"><Coins size={16}/> {user?.wallet?.balance || 0}</div>
      </header>

      {targetAuthor && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] mb-10 flex items-center gap-4 text-rose-600">
          <Heart fill="currentColor" size={24}/>
          <p className="text-sm font-bold">Mode Mécénat actif : Vous achetez des Li pour <span className="underline">{targetAuthor}</span></p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packs.map(pack => (
          <div key={pack.id} className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] hover:border-teal-500 transition-all group">
            <h3 className="font-black italic text-lg mb-2">{pack.name}</h3>
            <p className="text-4xl font-black text-slate-900 mb-6">{pack.amount.toLocaleString()} <span className="text-xs opacity-30">Li</span></p>
            <button 
              onClick={() => handlePurchase(pack)}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest group-hover:bg-teal-600 transition-all"
            >
              {loading === pack.id ? <Loader2 className="animate-spin mx-auto" size={16}/> : `Payer ${pack.price}$`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return <Suspense fallback={<p>Chargement...</p>}><ShopContent /></Suspense>;
}
