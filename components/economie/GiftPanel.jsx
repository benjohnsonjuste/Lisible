"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Gift, Loader2, Coins, ArrowLeft, Check, Wallet } from "lucide-react";
import { toast } from "sonner";

/**
 * Panneau d'envoi de cadeaux animés (les 7 cadeaux Li).
 * Props :
 *  - destinataire : { email, nom }
 *  - contexte : { type: "live" | "battle" | "lecture", refId, refTitre }
 *  - onSent(event, nouveauSolde)
 *  - theme : "dark" | "light" (defaut "light")
 */
export default function GiftPanel({ destinataire, contexte, onSent, theme = "light" }) {
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("choix"); // choix | confirmer
  const [sending, setSending] = useState(false);

  const dark = theme === "dark";

  useEffect(() => {
    try {
      const logged = localStorage.getItem("lisible_user");
      if (logged) setUser(JSON.parse(logged));
    } catch {}
    fetch("/api/economie?action=config", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.success && setConfig(j.config))
      .catch(() => {});
  }, []);

  const cadeaux = config?.cadeaux || [];
  const taux = config?.tauxUsdParLi || 0.01;

  const send = async () => {
    if (!selected || !user) return;
    if (!destinataire?.email) return toast.error("Destinataire introuvable.");
    setSending(true);
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "envoyer-cadeau",
          userEmail: user.email,
          destinataireEmail: destinataire.email,
          cadeauId: selected.id,
          contexte: contexte || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        if (j.solde !== undefined) {
          toast.error("Solde insuffisant. Rechargez vos Li pour offrir ce cadeau.");
        } else {
          toast.error(j.error || "Envoi impossible.");
        }
        return;
      }
      const updated = { ...user, li: j.nouveauSolde };
      localStorage.setItem("lisible_user", JSON.stringify(updated));
      setUser(updated);
      toast.success(`${selected.icone} ${selected.nom} offert à ${destinataire.nom} !`);
      setSelected(null);
      setStep("choix");
      onSent && onSent(j.event, j.nouveauSolde);
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  const card = dark
    ? "bg-white/[0.04] border-white/10 text-white"
    : "bg-white border-slate-100 text-slate-900";
  const muted = dark ? "text-slate-400" : "text-slate-500";

  if (!user) {
    return (
      <div className={`${card} border rounded-[2rem] p-8 text-center shadow-xl`}>
        <Gift size={32} className="mx-auto mb-3 text-teal-500" />
        <p className="font-black mb-1">Connectez-vous pour offrir un cadeau</p>
        <p className={`text-xs ${muted} mb-5`}>Les cadeaux Li soutiennent directement les auteurs.</p>
        <Link href="/login" className="inline-block px-8 py-3 rounded-2xl bg-teal-600 text-white font-black text-xs uppercase tracking-widest">
          Se connecter
        </Link>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={`${card} border rounded-[2rem] p-10 flex items-center justify-center`}>
        <Loader2 className="animate-spin text-teal-500" size={28} />
      </div>
    );
  }

  if (step === "confirmer" && selected) {
    const apres = (user.li || 0) - selected.li;
    return (
      <div className={`${card} border rounded-[2rem] p-8 shadow-xl max-w-md mx-auto`}>
        <button onClick={() => setStep("choix")} className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest ${muted} mb-6`}>
          <ArrowLeft size={14} /> Retour
        </button>
        <div className="text-center mb-6">
          <div className="text-7xl mb-3">{selected.icone}</div>
          <h3 className="text-xl font-black">{selected.nom}</h3>
          <p className={`text-xs ${muted} mt-1`}>{selected.description}</p>
          <p className="mt-3 text-sm font-black text-teal-600">
            {selected.li.toLocaleString("fr-FR")} Li <span className={`font-medium ${muted}`}>≈ {(selected.li * taux).toFixed(2)} $ US</span>
          </p>
        </div>
        <div className={`rounded-2xl p-4 text-xs font-bold ${dark ? "bg-white/5" : "bg-slate-50"} mb-6 space-y-1.5`}>
          <div className="flex justify-between"><span className={muted}>Pour</span><span>{destinataire.nom}</span></div>
          <div className="flex justify-between"><span className={muted}>Votre solde</span><span>{(user.li || 0).toLocaleString("fr-FR")} Li</span></div>
          <div className="flex justify-between"><span className={muted}>Après envoi</span><span className={apres < 0 ? "text-red-500" : ""}>{apres.toLocaleString("fr-FR")} Li</span></div>
          <div className="flex justify-between"><span className={muted}>L'auteur reçoit</span><span className="text-teal-600">{Math.floor((selected.li * (config.partAuteurPct || 85)) / 100).toLocaleString("fr-FR")} Li (85 %)</span></div>
        </div>
        {apres < 0 ? (
          <Link href="/portefeuille" className="block text-center w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black text-xs uppercase tracking-widest">
            <Wallet size={14} className="inline mr-2" />Recharger mes Li
          </Link>
        ) : (
          <button onClick={send} disabled={sending} className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            {sending ? "Envoi..." : `Offrir à ${destinataire.nom}`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${card} border rounded-[2rem] p-6 md:p-8 shadow-xl max-w-lg mx-auto`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 rounded-2xl text-teal-500"><Gift size={22} /></div>
          <div>
            <h3 className="font-black italic text-lg leading-tight">Offrir un cadeau</h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>pour {destinataire.nom}</p>
          </div>
        </div>
        <Link href="/portefeuille" className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black ${dark ? "bg-white/10" : "bg-teal-50 text-teal-700"}`}>
          <Coins size={13} /> {(user.li || 0).toLocaleString("fr-FR")} Li
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
        {cadeaux.map((c) => (
          <button
            key={c.id}
            onClick={() => { setSelected(c); setStep("confirmer"); }}
            className={`rounded-2xl border p-4 text-center transition-all hover:scale-[1.03] active:scale-95 ${dark ? "border-white/10 bg-white/[0.03] hover:border-teal-400/50" : "border-slate-100 bg-slate-50/60 hover:border-teal-300 hover:shadow-lg"}`}
          >
            <div className="text-4xl mb-2">{c.icone}</div>
            <div className="text-xs font-black leading-tight">{c.nom}</div>
            <div className={`text-[11px] font-bold mt-1 ${dark ? "text-teal-300" : "text-teal-700"}`}>{c.li.toLocaleString("fr-FR")} Li</div>
            <div className={`text-[10px] ${muted}`}>≈ {(c.li * taux).toFixed(2)} $</div>
          </button>
        ))}
      </div>

      <p className={`text-center text-[10px] ${muted} mt-5 leading-relaxed`}>
        85 % de chaque cadeau revient à l'auteur • 15 % soutient la plateforme<br />
        Les Li ne sont pas remboursables. <Link href="/terms" className="underline">Voir les CGU</Link>
      </p>
    </div>
  );
}
