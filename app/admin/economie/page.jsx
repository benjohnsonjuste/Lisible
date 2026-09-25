"use client";
import { useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck, ArrowLeft, Loader2, Check, X, Coins, Banknote, UserCheck } from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "commandes", label: "Commandes", icon: Coins },
  { id: "retraits", label: "Retraits", icon: Banknote },
  { id: "kyc", label: "KYC", icon: UserCheck },
];

export default function AdminEconomiePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tab, setTab] = useState("commandes");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const checkAuth = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const res = await fetch("/api/github-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "broadcast", adminToken: password, message: "Vérification staff", type: "info", dryRun: true }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_access_token", password);
        setIsAuthenticated(true);
        setError(false);
        loadTab("commandes", password);
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const token = () => sessionStorage.getItem("admin_access_token") || "";

  const loadTab = async (t = tab, pwd = token()) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/economie?action=admin&tab=${t}&adminToken=${encodeURIComponent(pwd)}`, { cache: "no-store" });
      const j = await res.json();
      if (res.ok) setItems(j.items || []);
      else toast.error(j.error || "Chargement impossible");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setItems([]); loadTab(t); };

  const validerCommande = async (orderId, valider) => {
    if (!confirm(valider ? `Valider la commande ${orderId} et créditer les Li ?` : `Rejeter la commande ${orderId} ?`)) return;
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: valider ? "valider-commande" : "rejeter-commande", adminToken: token(), orderId }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Action impossible");
      toast.success(valider ? "Li crédités !" : "Commande rejetée.");
      loadTab();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const traiterKyc = async (email, decision) => {
    if (!confirm(`${decision === "verifier" ? "Vérifier" : "Refuser"} l'identité de ${email} ?`)) return;
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-kyc", adminToken: token(), targetEmail: email, decision }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Action impossible");
      toast.success("KYC traité.");
      loadTab();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const traiterRetrait = async (retraitId, decision) => {
    const reference = decision === "payer" ? prompt("Référence du paiement (ex. n° transaction PayPal) :") || "" : "";
    try {
      const res = await fetch("/api/economie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-retrait", adminToken: token(), retraitId, decision, reference }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.error || "Action impossible");
      toast.success(decision === "payer" ? "Retrait marqué comme payé." : "Retrait refusé, gains restaurés.");
      loadTab();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-500 mb-8"><ArrowLeft size={14} /> Accueil</Link>
          <div className="bg-white/[0.04] border border-white/10 rounded-[2rem] p-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-5"><Lock size={24} /></div>
            <h1 className="text-xl font-black mb-1">Admin Économie</h1>
            <p className="text-xs text-slate-500 mb-6">Commandes Li, retraits et vérifications d'identité.</p>
            <form onSubmit={checkAuth} className="space-y-3">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe admin"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-amber-400/60" />
              {error && <p className="text-xs text-red-400 font-bold">Mot de passe incorrect.</p>}
              <button disabled={isVerifying} className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2">
                {isVerifying ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />} Déverrouiller
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black mb-1">Admin — Économie Li</h1>
        <p className="text-xs text-slate-500 mb-6">Validez les paiements Interac, les identités et les retraits.</p>

        <div className="flex gap-2 mb-6 bg-white/[0.04] rounded-2xl p-1.5 border border-white/10">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${tab === t.id ? "bg-amber-500 text-black" : "text-slate-400"}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-amber-400" size={32} /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-16">Rien à traiter pour le moment. 🎉</p>
        ) : (
          <div className="space-y-3">
            {tab === "commandes" && items.map((o) => (
              <div key={o.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-black text-sm">{o.li.toLocaleString("fr-FR")} Li <span className="text-slate-500 font-medium">• {o.prixUsd.toFixed(2)} $ US • {o.methode}</span></p>
                  <p className="text-xs text-slate-400">{o.userNom} ({o.userEmail}) • {o.packNom}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{o.id} • {new Date(o.date).toLocaleString("fr-FR")}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${o.statut === "en_attente" ? "bg-amber-500/20 text-amber-300" : o.statut === "payee" ? "bg-teal-500/20 text-teal-300" : "bg-red-500/20 text-red-300"}`}>{o.statut}</span>
                </div>
                {o.statut === "en_attente" && (
                  <div className="flex gap-2">
                    <button onClick={() => validerCommande(o.id, true)} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-black uppercase flex items-center gap-1.5"><Check size={14} /> Valider</button>
                    <button onClick={() => validerCommande(o.id, false)} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-xs font-black uppercase flex items-center gap-1.5"><X size={14} /> Rejeter</button>
                  </div>
                )}
              </div>
            ))}

            {tab === "retraits" && items.map((r) => (
              <div key={r.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-black text-sm">{r.montantLi.toLocaleString("fr-FR")} Li <span className="text-slate-500 font-medium">→ net {r.netLi.toLocaleString("fr-FR")} Li (≈ {r.netUsd.toFixed(2)} $ US)</span></p>
                  <p className="text-xs text-slate-400">{r.userNom} ({r.userEmail}) • {r.moyen} • {r.coordonnees}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{r.id} • {new Date(r.date).toLocaleString("fr-FR")}{r.reference ? ` • réf: ${r.reference}` : ""}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${r.statut === "en_attente" ? "bg-amber-500/20 text-amber-300" : r.statut === "paye" ? "bg-teal-500/20 text-teal-300" : "bg-red-500/20 text-red-300"}`}>{r.statut}</span>
                </div>
                {r.statut === "en_attente" && (
                  <div className="flex gap-2">
                    <button onClick={() => traiterRetrait(r.id, "payer")} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-black uppercase flex items-center gap-1.5"><Check size={14} /> Marquer payé</button>
                    <button onClick={() => traiterRetrait(r.id, "refuser")} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-xs font-black uppercase flex items-center gap-1.5"><X size={14} /> Refuser</button>
                  </div>
                )}
              </div>
            ))}

            {tab === "kyc" && items.map((k) => (
              <div key={k.email} className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs space-y-1">
                  <p className="font-black text-sm">{k.name} <span className="text-slate-500 font-medium">({k.email})</span></p>
                  <p className="text-slate-400">{k.kyc.prenom} {k.kyc.nom} • né(e) le {k.kyc.dateNaissance} • {k.kyc.pays}</p>
                  <p className="text-slate-400">{k.kyc.pieceType} : {k.kyc.pieceNumero}</p>
                  <p className="text-slate-400">Paiement : {k.kyc.moyenPaiement} — {k.kyc.coordonnees}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${k.kyc.statut === "en_attente" ? "bg-amber-500/20 text-amber-300" : "bg-teal-500/20 text-teal-300"}`}>{k.kyc.statut}</span>
                </div>
                {k.kyc.statut === "en_attente" && (
                  <div className="flex gap-2">
                    <button onClick={() => traiterKyc(k.email, "verifier")} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-black uppercase flex items-center gap-1.5"><Check size={14} /> Vérifier</button>
                    <button onClick={() => traiterKyc(k.email, "refuser")} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-xs font-black uppercase flex items-center gap-1.5"><X size={14} /> Refuser</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
