"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, HandCoins, ShieldAlert, PieChart, CalendarClock } from "lucide-react";

function user() {
  try { return JSON.parse(localStorage.getItem("lisible_user") || "null"); } catch { return null; }
}

export default function CampagneDetailPage() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [montant, setMontant] = useState(50);
  const [msg, setMsg] = useState("");
  const [chargement, setChargement] = useState(true);
  const me = typeof window !== "undefined" ? user() : null;

  const charger = async () => {
    setChargement(true);
    try {
      const [rc, rg] = await Promise.all([
        fetch(`/api/coproduction?action=campagne&id=${id}`, { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/coproduction?action=config", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (rc.success) setC(rc.campagne);
      if (rg.success) setCfg(rg.config);
    } catch { setMsg("Erreur de chargement."); }
    setChargement(false);
  };
  useEffect(() => { if (id) charger(); }, [id]);

  const contribuer = async () => {
    if (!me) { setMsg("Connectez-vous pour contribuer."); return; }
    if (!confirm(`Confirmer votre contribution de ${Number(montant).toFixed(2)} $ CA à « ${c.titre} » ?\n\nDes frais de dossier non remboursables de ${c.fraisDepotPct} % s'appliquent. Aucun rendement n'est garanti.`)) return;
    setMsg("Contribution en cours…");
    const res = await fetch("/api/coproduction", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "contribuer", campagneId: id, userEmail: me.email, montantCAD: Number(montant) }),
    }).then((r) => r.json());
    if (res.success) { setMsg(`✅ Contribution enregistrée ! Mise nette : ${res.montantNetCAD.toFixed(2)} $ CA. Nouveau solde : ${res.nouveauSolde.toLocaleString("fr-FR")} Li.`); charger(); }
    else setMsg(`❌ ${res.error}`);
  };

  if (chargement) return <div className="max-w-4xl mx-auto px-6 py-16 text-slate-400 text-sm">Chargement…</div>;
  if (!c) return <div className="max-w-4xl mx-auto px-6 py-16 text-slate-400 text-sm">Campagne introuvable. <Link href="/coproduction" className="text-teal-600 font-bold">Retour</Link></div>;

  const joursRestants = c.dateFin ? Math.max(0, Math.ceil((new Date(c.dateFin) - new Date()) / 86400000)) : null;
  const budgetTotal = (c.budget?.correction || 0) + (c.budget?.couverture || 0) + (c.budget?.marketing || 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <Link href="/coproduction" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"><ArrowLeft size={14} /> Toutes les campagnes</Link>

      <header className="space-y-3">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">{c.titre}</h1>
        <p className="text-slate-500 text-sm">{c.description}</p>
        {joursRestants !== null && c.statut === "en_cours" && (
          <p className="text-xs font-bold text-amber-600 flex items-center gap-1"><CalendarClock size={14} /> {joursRestants} jour(s) restant(s)</p>
        )}
      </header>

      {msg && <div className="p-4 bg-slate-900 text-white rounded-2xl text-sm font-medium">{msg}</div>}

      {/* Progression */}
      <section className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex justify-between text-sm font-bold mb-2">
          <span className="text-teal-700">{Number(c.montantCollecteCAD || 0).toFixed(2)} $ CA collectés</span>
          <span className="text-slate-400">Objectif : {Number(c.objectifCAD).toFixed(2)} $ CA</span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" style={{ width: `${Math.min(100, c.pourcentage)}%` }} />
        </div>
        <div className="mt-2 text-sm font-black text-slate-900">{c.pourcentage} % — {c.nbContributeurs} coproducteur(s)</div>
      </section>

      {/* Budget */}
      {budgetTotal > 0 && (
        <section className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
          <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><PieChart size={18} className="text-teal-600" /> Budget de lancement</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[["Correction", c.budget.correction], ["Couverture", c.budget.couverture], ["Marketing", c.budget.marketing]].map(([label, v]) => (
              <div key={label} className="bg-white rounded-2xl p-4">
                <div className="text-xl font-black text-slate-900">{Number(v || 0).toFixed(2)} $</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contribuer */}
      {c.statut === "en_cours" && (
        <section className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-[2rem] p-6">
          <h2 className="font-black text-slate-900 mb-2 flex items-center gap-2"><HandCoins size={18} className="text-teal-600" /> Soutenir ce livre</h2>
          <p className="text-xs text-slate-500 mb-4">Contribution débitée de votre Solde Lisible. Frais de dossier non remboursables : {c.fraisDepotPct} %.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 border border-teal-200">
              <input type="number" min={cfg?.contributionMinCAD || 5} value={montant} onChange={(e) => setMontant(Number(e.target.value))} className="w-28 py-3 font-black text-lg outline-none" />
              <span className="text-sm font-bold text-slate-400">$ CA</span>
            </div>
            <button onClick={contribuer} className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Contribuer {Number(montant).toFixed(2)} $ CA
            </button>
          </div>
          {!me && <p className="text-xs text-amber-600 font-bold mt-3">Connectez-vous pour contribuer. <Link href="/login" className="underline">Se connecter</Link></p>}
        </section>
      )}

      {/* Partage des revenus */}
      <section className="bg-white border border-slate-100 rounded-[2rem] p-6">
        <h2 className="font-black text-slate-900 mb-4">Partage des revenus réels</h2>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="bg-teal-50 rounded-2xl p-4"><div className="text-2xl font-black text-teal-700">60 %</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Coproducteurs</div></div>
          <div className="bg-blue-50 rounded-2xl p-4"><div className="text-2xl font-black text-blue-700">20 %</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Auteur</div></div>
          <div className="bg-slate-100 rounded-2xl p-4"><div className="text-2xl font-black text-slate-700">20 %</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Plateforme</div></div>
        </div>
        <ul className="text-xs text-slate-500 space-y-1 list-disc pl-5">
          <li>Versé uniquement sur le chiffre d'affaires <strong>réellement encaissé</strong>, après le délai anti-annulation de {cfg?.delaiEncaissementJours} jours.</li>
          <li>Plafond par coproducteur : <strong>{c.plafondPct} %</strong> de sa mise nette. Au-delà, sa part revient aux autres coproducteurs puis à l'auteur.</li>
          <li>Durée maximale : <strong>{cfg?.dureeMaxMois} mois</strong> après la sortie officielle du livre.</li>
        </ul>
      </section>

      <div className="bg-rose-50 border border-rose-200 rounded-[2rem] p-6 flex gap-3">
        <ShieldAlert size={20} className="shrink-0 text-rose-500" />
        <p className="text-xs text-rose-900/80">
          <strong>Avertissement sur les risques :</strong> ceci n'est ni un placement financier garanti ni un prêt. Aucun rendement n'est promis. Si le livre ne génère pas de ventes, vous ne recevez rien et pouvez perdre l'intégralité de votre mise (hors remboursement automatique en cas d'échec de la campagne). Lisez les <Link href="/terms" className="underline font-bold">CGU, article 07</Link>.
        </p>
      </div>
    </div>
  );
}
