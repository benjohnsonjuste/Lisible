"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Gift, Loader2, AlertCircle, Search, Users } from "lucide-react";

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
};

export default function CadeauLi() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [targetEmail, setTargetEmail] = useState("");
  const [amount, setAmount] = useState(250);
  const [allEmails, setAllEmails] = useState([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  const MIN_GIFT = 250;

  // Récupération des utilisateurs (même technique que la page admin/signaux)
  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));

    const fetchAllUsers = async () => {
      setIsFetchingUsers(true);
      try {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`;
        const res = await fetch(url);
        if (res.ok) {
          const files = await res.json();
          const emails = files
            .filter(f => f.name.endsWith('.json'))
            .map(f => f.name.replace('.json', '').replace(/_/g, '.'));
          setAllEmails(emails);
        }
      } catch (err) {
        console.error("Erreur récupération utilisateurs:", err);
      } finally {
        setIsFetchingUsers(false);
      }
    };

    fetchAllUsers();
  }, []);

  const handleSendGift = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Connectez-vous pour offrir des Li.");
    
    if (amount < MIN_GIFT) {
      return toast.error(`Le don minimum est de ${MIN_GIFT} Li.`);
    }

    if (user.li < amount) {
      toast.error("Solde insuffisant pour ce cadeau.");
      setTimeout(() => {
        router.push(`/shop?for=${targetEmail || user.email}&back=gift`);
      }, 2000);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gift_li",
          userEmail: user.email,
          recipientEmail: targetEmail.toLowerCase().trim(),
          amount: parseInt(amount)
        })
      });

      const result = await res.json();

      if (res.ok) {
        const updatedUser = { ...user, li: user.li - amount };
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        toast.success(`Cadeau de ${amount} Li envoyé avec succès !`);
        setTargetEmail("");
        setAmount(250);
      } else {
        throw new Error(result.error || "Échec du transfert");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-50 rounded-2xl text-teal-600">
          <Gift size={24} />
        </div>
        <div>
          <h2 className="font-black italic text-xl text-slate-900">Offrir de l'énergie</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transfert direct de Li</p>
        </div>
      </div>

      <form onSubmit={handleSendGift} className="space-y-6">
        {/* Destinataire avec Auto-complétion */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block flex justify-between">
            Email de la plume
            {isFetchingUsers && <Loader2 size={10} className="animate-spin" />}
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="email"
              list="users-list"
              required
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Sélectionner ou saisir un email"
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            <datalist id="users-list">
              {allEmails.map((email) => (
                <option key={email} value={email} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Montant */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">
            Montant (Min. {MIN_GIFT})
          </label>
          <input
            type="number"
            min={MIN_GIFT}
            required
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </div>

        {/* Info Solde */}
        <div className="flex items-center justify-between px-2 text-[11px] font-bold">
          <span className="text-slate-400 uppercase">Votre solde :</span>
          <span className={`flex items-center gap-1 ${user?.li < amount ? 'text-red-500' : 'text-teal-600'}`}>
            {user?.li || 0} Li
            {user?.li < amount && <AlertCircle size={12} />}
          </span>
        </div>

        {/* Bouton d'envoi */}
        <button
          type="submit"
          disabled={loading || !targetEmail}
          className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-teal-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Envoyer le cadeau <Send size={14} />
            </>
          )}
        </button>
      </form>
      
      <div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-tighter">
        <Users size={10} />
        {allEmails.length} plumes disponibles dans l'Atelier
      </div>
    </div>
  );
}
