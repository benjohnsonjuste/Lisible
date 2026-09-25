"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { HandCoins, TrendingUp, Landmark, Wallet, ArrowLeft, Info } from "lucide-react";

const STATUT_LABEL = {
  en_cours: "En collecte", financee: "Financée", en_vente: "En vente",
  echouee: "Non financée", terminee: "Terminée", brouillon: "Bientôt",
};
const STATUT_STYLE = {
  en_cours: "bg-teal-100 text-teal-700", financee: "bg-blue-100 text-blue-700",
  en_vente: "bg-amber-100 text-amber-700", echouee: "bg-slate-100 text-slate-500",
  terminee: "bg-slate-900 text-white", brouillon: "bg-slate-100 text-slate-500",
};

function user() {
  try { return JSON.parse(localStorage.getItem("lisible_user") || "null"); } catch { return null; }
}

export default function CoproductionPage() {
  const [campagnes, setCampagnes] = useState([]);
  const [pool, setPool] = useState(null);
  const [mesContribs, setMesContribs] = useState([]);
  const [nbParts, setNbParts] = useState(1);
  const [msg, setMsg] = useState("");
  const [chargement, setChargement] = useState(true);
  const me = typeof window !== "undefined" ? user() : null;

  const charger = async () => {
    setChargement(true);
    try {
      const [rc, rp] = await Promise.all([
        fetch("/api/coproduction?action=campagnes", { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/coproduction?action=pool${me ? `&userEmail=${encodeURIComponent(me.email)}` : ""}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (rc.success) setCampagnes(rc.campagnes);
      if (rp.success) setPool(rp.pool);
      if (me) {
        const rm = await fetch(`/api/coproduction?action=mes-contributions&userEmail=${encodeURIComponent(me.email)}`, { cache: "no-store" }).then((r) => r.json());
        if (rm.success) setMesContribs(rm.contributions);
      }
    } catch { setMsg("Erreur de chargement."); }
    setChargement(false);
  };

  useEffect(() => { charger(); }, []);

  const acheterParts = async () => {
    if (!me) { setMsg("Connectez-vous pour investir dans le Pool."); return; }
    setMsg("Achat en cours…");
    const res = await fetch("/api/coproduction", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acheter-part-pool", userEmail: me.email, nbParts }),
    }).then((r) => r.json());
    if (res.success) { setMsg(`✅ ${nbParts} part(s) achetée(s) ! Nouveau solde : ${res.nouveauSolde.toLocaleString("fr-FR")} Li.`); charger(); }
    else setMsg(`❌ ${res.error}`);
  };

  const visibles = campagnes.filter((c) => c.statut !== "brouillon");

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      <header className="text-center space-y-3">
        <div className="inline-flex p-4 bg-slate-900 text-amber-400 rounded-[1.5rem]"><HandCoins size={36} /></div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic">Coproduction participative</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm">
          Soutenez la publication d'un livre et recevez une part de ses revenus réels : <strong>60 %</strong> des recettes aux coproducteurs (plafond 115 % de la mise), <strong>20 %</strong> à l'auteur, <strong>20 %</strong> à la plateforme — pendant 12 mois maximum.
        </p>
        <p className="text-xs text-slate-400 max-w-2xl mx-auto italic">
          Aucun rendement n'est garanti : si le livre ne génère pas de ventes, rien n'est versé. Vous pouvez perdre tout ou partie de votre mise.
        </p>
      </header>

      {msg && <div className="p-4 bg-slate-900 text-white rounded-2xl text-sm font-medium text-center">{msg}</div>}

      {/* Pool Lisible */}
      {pool && (
        <section className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-[2.5rem] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <Landmark className="text-amber-600" size={28} />
            <h2 className="text-2xl font-black text-slate-900 italic">{pool.nom}</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Investissez dans un fonds diversifié : notre comité éditorial sélectionne 3 à 5 livres prometteurs chaque trimestre et y répartit le capital. Les gains sont redistribués aux détenteurs de parts, après frais de gestion de {pool.fraisGestionPct} %.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 text-center"><div className="text-2xl font-black text-slate-900">{pool.totalParts.toLocaleString("fr-FR")}</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Parts émises</div></div>
            <div className="bg-white rounded-2xl p-4 text-center"><div className="text-2xl font-black text-slate-900">{pool.capitalCAD.toLocaleString("fr-FR")} $</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Capital (CA)</div></div>
            <div className="bg-white rounded-2xl p-4 text-center"><div className="text-2xl font-black text-slate-900">{pool.nbInvestisseurs}</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Investisseurs</div></div>
            <div className="bg-white rounded-2xl p-4 text-center"><div className="text-2xl font-black text-amber-600">{pool.prixPartCAD} $</div><div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Prix / part (CA)</div></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input type="number" min="1" value={nbParts} onChange={(e) => setNbParts(Math.max(1, Number(e.target.value)))} className="w-24 px-4 py-3 rounded-2xl border border-amber-200 text-center font-black" />
            <button onClick={acheterParts} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Acheter des parts ({(nbParts * pool.prixPartCAD).toFixed(2)} $ CA)
            </button>
          </div>
        </section>
      )}

      {/* Campagnes */}
      <section>
        <h2 className="text-2xl font-black text-slate-900 italic mb-6 flex items-center gap-2"><TrendingUp className="text-teal-600" /> Campagnes</h2>
        {chargement ? <p className="text-slate-400 text-sm">Chargement…</p> : visibles.length === 0 ? (
          <p className="text-slate-400 text-sm italic">Aucune campagne pour le moment. Revenez bientôt !</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {visibles.map((c) => (
              <Link key={c.id} href={`/coproduction/${c.id}`} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-black text-lg text-slate-900 group-hover:text-teal-700">{c.titre}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${STATUT_STYLE[c.statut]}`}>{STATUT_LABEL[c.statut]}</span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{c.description}</p>
                <div className="mb-2 flex justify-between text-xs font-bold">
                  <span className="text-teal-700">{Number(c.montantCollecteCAD || 0).toFixed(2)} $ CA</span>
                  <span className="text-slate-400">Objectif : {Number(c.objectifCAD).toFixed(2)} $ CA</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, c.pourcentage)}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-400 font-medium">{c.pourcentage} % — {c.nbContributeurs} coproducteur(s)</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Mes contributions */}
      {me && mesContribs.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-slate-900 italic mb-6 flex items-center gap-2"><Wallet className="text-amber-500" /> Mes contributions</h2>
          <div className="space-y-3">
            {mesContribs.map((m, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900">{m.titre}</div>
                  <div className="text-xs text-slate-400">Mise nette : {Number(m.montantNetCAD).toFixed(2)} $ CA — Reçu : {Number(m.recuCAD).toFixed(2)} $ CA</div>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${STATUT_STYLE[m.statutCampagne]}`}>{STATUT_LABEL[m.statutCampagne]}</span>
                  <Link href={`/coproduction/${m.campagneId}`} className="text-xs font-black text-teal-600 uppercase tracking-widest">Détails</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 flex gap-3 text-xs text-slate-500">
        <Info size={18} className="shrink-0 text-slate-400" />
        <p>
          <strong>Comment ça marche :</strong> vous contribuez depuis votre Solde Lisible (Li). Des frais de dossier non remboursables de 2,5 % s'appliquent. Si la campagne n'atteint pas 100 % de son objectif, votre mise nette vous est <strong>automatiquement recréditée en Li</strong>. Si elle réussit, vous touchez 60 % des recettes au prorata de votre mise, jusqu'à 115 % de celle-ci, pendant 12 mois après la sortie du livre.
        </p>
      </div>

      <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"><ArrowLeft size={14} /> Accueil</Link>
    </div>
  );
}
