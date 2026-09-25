"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, Plus, Rocket, CalendarCheck, ShoppingCart, Landmark } from "lucide-react";

const token = () => (typeof window !== "undefined" ? sessionStorage.getItem("admin_access_token") || "" : "");

export default function AdminCoproductionPage() {
  const [pwd, setPwd] = useState("");
  const [ok, setOk] = useState(false);
  const [campagnes, setCampagnes] = useState([]);
  const [pool, setPool] = useState(null);
  const [msg, setMsg] = useState("");
  const [onglet, setOnglet] = useState("campagnes");
  const [form, setForm] = useState({ titre: "", auteurEmail: "", description: "", objectifCAD: 1000, correction: 300, couverture: 200, marketing: 500, plafondPct: 115, dureeJours: 45 });
  const [vente, setVente] = useState({ campagneId: "", montantCAD: "", canal: "lisible" });
  const [sortie, setSortie] = useState({ campagneId: "", dateSortie: "" });
  const [deploiement, setDeploiement] = useState({ trimestre: "", selections: [] });
  const [trimestreDist, setTrimestreDist] = useState("");

  const charger = async () => {
    try {
      const [rc, rp] = await Promise.all([
        fetch("/api/coproduction?action=campagnes", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/coproduction?action=pool", { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (rc.success) setCampagnes(rc.campagnes);
      if (rp.success) setPool(rp.pool);
    } catch { setMsg("Erreur de chargement."); }
  };

  useEffect(() => { if (sessionStorage.getItem("admin_access_token")) { setOk(true); charger(); } }, []);

  const login = async () => {
    const res = await fetch("/api/economie", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "broadcast", adminToken: pwd, message: "Vérification staff", type: "info", dryRun: true }),
    }).then((r) => r.json()).catch(() => ({}));
    if (res.success) { sessionStorage.setItem("admin_access_token", pwd); setOk(true); charger(); }
    else setMsg("❌ Mot de passe incorrect.");
  };

  const post = async (payload) => {
    const res = await fetch("/api/coproduction", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, adminToken: token() }),
    }).then((r) => r.json());
    setMsg(res.success ? "✅ Opération réussie." : `❌ ${res.error}`);
    if (res.success) charger();
    return res;
  };

  if (!ok) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center space-y-4">
        <ShieldCheck size={40} className="mx-auto text-slate-300" />
        <h1 className="text-2xl font-black text-slate-900">Administration Coproduction</h1>
        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Mot de passe admin" className="w-full px-5 py-3 rounded-2xl border border-slate-200" onKeyDown={(e) => e.key === "Enter" && login()} />
        <button onClick={login} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Accéder</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
    );
  }

  const trimestreDefaut = () => {
    const d = new Date();
    return `${d.getFullYear()}-T${Math.floor(d.getMonth() / 3) + 1}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-3xl font-black text-slate-900 italic">Admin — Coproduction</h1>
      {msg && <div className="p-4 bg-slate-900 text-white rounded-2xl text-sm font-medium">{msg}</div>}

      <div className="flex gap-2">
        {[["campagnes", "Campagnes"], ["ventes", "Ventes & sorties"], ["pool", "Pool Lisible"]].map(([k, l]) => (
          <button key={k} onClick={() => setOnglet(k)} className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${onglet === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>{l}</button>
        ))}
      </div>

      {onglet === "campagnes" && (
        <div className="space-y-8">
          <section className="bg-white border border-slate-100 rounded-[2rem] p-6">
            <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Plus size={18} /> Nouvelle campagne</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input placeholder="Titre du livre" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm" />
              <input placeholder="Email de l'auteur" value={form.auteurEmail} onChange={(e) => setForm({ ...form, auteurEmail: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm md:col-span-2" rows={3} />
              {[["objectifCAD", "Objectif ($ CA)"], ["correction", "Budget correction ($ CA)"], ["couverture", "Budget couverture ($ CA)"], ["marketing", "Budget marketing ($ CA)"], ["plafondPct", "Plafond % (110-120)"], ["dureeJours", "Durée (jours)"]].map(([k, l]) => (
                <label key={k} className="text-xs font-bold text-slate-500">{l}
                  <input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-black text-slate-900" />
                </label>
              ))}
            </div>
            <button onClick={() => post({ action: "creer-campagne", ...form, budget: { correction: form.correction, couverture: form.couverture, marketing: form.marketing } })} className="mt-4 px-8 py-3 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Créer (brouillon)</button>
          </section>

          <section className="space-y-3">
            {campagnes.map((c) => (
              <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">{c.titre} <span className="text-xs text-slate-400">({c.statut})</span></div>
                  <div className="text-xs text-slate-400">{Number(c.montantCollecteCAD || 0).toFixed(2)} / {Number(c.objectifCAD).toFixed(2)} $ CA — {c.nbContributeurs} contributeurs</div>
                </div>
                <div className="flex gap-2">
                  {c.statut === "brouillon" && <button onClick={() => post({ action: "publier-campagne", campagneId: c.id, dureeJours: 45 })} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1"><Rocket size={14} /> Publier</button>}
                  <a href={`/coproduction/${c.id}`} target="_blank" className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-black uppercase text-slate-600">Voir</a>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {onglet === "ventes" && (
        <div className="space-y-8">
          <section className="bg-white border border-slate-100 rounded-[2rem] p-6">
            <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><CalendarCheck size={18} /> Fixer la sortie officielle</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={sortie.campagneId} onChange={(e) => setSortie({ ...sortie, campagneId: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm">
                <option value="">Choisir une campagne financée…</option>
                {campagnes.filter((c) => c.statut === "financee").map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
              </select>
              <input type="date" value={sortie.dateSortie} onChange={(e) => setSortie({ ...sortie, dateSortie: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm" />
              <button onClick={() => sortie.campagneId && post({ action: "fixer-sortie", ...sortie })} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Lancer les revenus</button>
            </div>
          </section>

          <section className="bg-white border border-slate-100 rounded-[2rem] p-6">
            <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Enregistrer une vente</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select value={vente.campagneId} onChange={(e) => setVente({ ...vente, campagneId: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm">
                <option value="">Campagne…</option>
                {campagnes.filter((c) => c.statut === "en_vente" || c.statut === "terminee").map((c) => <option key={c.id} value={c.id}>{c.titre}</option>)}
              </select>
              <input type="number" placeholder="Montant $ CA" value={vente.montantCAD} onChange={(e) => setVente({ ...vente, montantCAD: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm w-40" />
              <input placeholder="Canal" value={vente.canal} onChange={(e) => setVente({ ...vente, canal: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm w-40" />
              <button onClick={() => vente.campagneId && vente.montantCAD && post({ action: "enregistrer-vente", campagneId: vente.campagneId, montantCAD: Number(vente.montantCAD), canal: vente.canal, cle: `man_${Date.now()}` })} className="px-6 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Enregistrer</button>
            </div>
            <p className="text-xs text-slate-400 mt-3">Les ventes sont distribuées automatiquement (60/20/20) après le délai d'encaissement définitif. La distribution tourne chaque jour.</p>
          </section>
        </div>
      )}

      {onglet === "pool" && pool && (
        <div className="space-y-8">
          <section className="bg-white border border-slate-100 rounded-[2rem] p-6">
            <h2 className="font-black text-slate-900 mb-2 flex items-center gap-2"><Landmark size={18} /> État du Pool</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-50 rounded-2xl p-4"><div className="text-xl font-black">{pool.totalParts}</div><div className="text-[10px] uppercase text-slate-400 font-bold">Parts</div></div>
              <div className="bg-slate-50 rounded-2xl p-4"><div className="text-xl font-black">{pool.capitalCAD.toFixed(2)} $</div><div className="text-[10px] uppercase text-slate-400 font-bold">Capital</div></div>
              <div className="bg-slate-50 rounded-2xl p-4"><div className="text-xl font-black">{pool.deploiements.length}</div><div className="text-[10px] uppercase text-slate-400 font-bold">Déploiements</div></div>
              <div className="bg-slate-50 rounded-2xl p-4"><div className="text-xl font-black">{pool.distributions.length}</div><div className="text-[10px] uppercase text-slate-400 font-bold">Distributions</div></div>
            </div>
          </section>

          <section className="bg-white border border-slate-100 rounded-[2rem] p-6">
            <h2 className="font-black text-slate-900 mb-4">Déployer le capital (sélection trimestrielle, max 5 livres)</h2>
            <div className="flex gap-3 mb-4">
              <input placeholder="Trimestre (ex. 2026-T4)" value={deploiement.trimestre || trimestreDefaut()} onChange={(e) => setDeploiement({ ...deploiement, trimestre: e.target.value })} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm w-48" />
            </div>
            <div className="space-y-2">
              {campagnes.filter((c) => c.statut === "en_cours" || c.statut === "financee").map((c) => {
                const sel = deploiement.selections.find((s) => s.campagneId === c.id);
                return (
                  <div key={c.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
                    <input type="checkbox" checked={!!sel} onChange={(e) => {
                      if (e.target.checked) setDeploiement({ ...deploiement, selections: [...deploiement.selections, { campagneId: c.id, montantCAD: 200 }] });
                      else setDeploiement({ ...deploiement, selections: deploiement.selections.filter((s) => s.campagneId !== c.id) });
                    }} className="w-5 h-5" />
                    <span className="flex-1 text-sm font-bold">{c.titre}</span>
                    {sel && <input type="number" value={sel.montantCAD} onChange={(e) => setDeploiement({ ...deploiement, selections: deploiement.selections.map((s) => s.campagneId === c.id ? { ...s, montantCAD: Number(e.target.value) } : s) })} className="w-32 px-3 py-2 rounded-xl border border-slate-200 text-sm" placeholder="$ CA" />}
                  </div>
                );
              })}
            </div>
            <button onClick={() => post({ action: "deployer-pool", trimestre: deploiement.trimestre || trimestreDefaut(), allocations: deploiement.selections })} className="mt-4 px-8 py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Déployer</button>
          </section>

          <section className="bg-white border border-slate-100 rounded-[2rem] p-6">
            <h2 className="font-black text-slate-900 mb-4">Redistribuer les gains aux détenteurs de parts</h2>
            <div className="flex gap-3">
              <input placeholder="Trimestre (ex. 2026-T4)" value={trimestreDist} onChange={(e) => setTrimestreDist(e.target.value)} className="px-4 py-3 rounded-2xl border border-slate-200 text-sm w-48" />
              <button onClick={() => trimestreDist && post({ action: "distribuer-pool", trimestre: trimestreDist })} className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Distribuer</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
