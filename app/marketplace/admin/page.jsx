"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, Play, CheckCircle2, BadgeCheck, Ban } from "lucide-react";
import { apiGet, apiPost, getSessionToken, formatDateFR } from "@/components/freelance/api";
import StatusBadge from "@/components/freelance/StatusBadge";
import Money from "@/components/freelance/Money";

export default function AdminPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [pros, setPros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const [splitAmount, setSplitAmount] = useState({});
  const [decisionNote, setDecisionNote] = useState({});
  const [manualRef, setManualRef] = useState({});

  const load = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const [d, p, l, pr] = await Promise.all([
        apiGet("admin_disputes", { sessionToken: token }),
        apiGet("admin_payouts", { sessionToken: token }),
        apiGet("admin_ledger", { sessionToken: token }),
        apiGet("list_pros"),
      ]);
      setDisputes(d.disputes || []);
      setPayouts(p.payouts || []);
      setLedger(l.entries || []);
      setPros(pr.pros || []);
    } catch (e) {
      if (e.message && (e.message.includes("403") || /accès|interdit|autorisé|admin/i.test(e.message))) {
        setForbidden(true);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function run(key, fn) {
    setBusy(key);
    setNotice(null);
    try {
      await fn();
      await load();
      setNotice("Action réalisée avec succès.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center min-h-screen bg-[#FCFBF9]">
        <div className="inline-block w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-medium mt-4">Chargement de l&apos;administration…</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 min-h-screen bg-[#FCFBF9]">
        <div className="bg-white rounded-3xl border border-slate-100 p-10 shadow-sm text-center">
          <ShieldAlert size={56} className="text-slate-300 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 mb-2">Accès réservé à l&apos;administration</h1>
          <p className="text-slate-500 font-medium text-sm mb-6">Vous n&apos;avez pas les droits nécessaires pour voir cette page.</p>
          <Link href="/marketplace" className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-teal-700 transition-all">
            Retour à l&apos;Espace Freelance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2">Espace Freelance</p>
      <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-8">Administration</h1>

      {notice && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl px-5 py-4 text-sm font-bold mb-6 flex items-center gap-2">
          <CheckCircle2 size={18} /> {notice}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm font-bold mb-6 flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Litiges */}
      <AdminSection title={`Litiges (${disputes.length})`} icon={AlertTriangle}>
        {disputes.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucun litige en cours.</p>
        ) : (
          <div className="space-y-5">
            {disputes.map((d) => (
              <div key={d.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <Link href={`/marketplace/missions/${d.id}`} className="font-black text-slate-900 hover:text-teal-700 hover:underline">
                      {d.title}
                    </Link>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {d.writerName} · <Money amount={d.budget} currency={d.currency || "CAD"} />
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                {d.disputeReason && (
                  <p className="text-sm text-slate-700 bg-white rounded-xl p-4 border border-slate-100 mb-4">
                    <span className="font-bold">Motif : </span>{d.disputeReason}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                      Montant au pro (si partage)
                    </label>
                    <input
                      type="number" min="0" step="0.01"
                      value={splitAmount[d.id] ?? ""}
                      onChange={(e) => setSplitAmount((s) => ({ ...s, [d.id]: e.target.value }))}
                      placeholder="Ex. : 42.50"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Note (optionnel)</label>
                    <input
                      type="text"
                      value={decisionNote[d.id] ?? ""}
                      onChange={(e) => setDecisionNote((s) => ({ ...s, [d.id]: e.target.value }))}
                      placeholder="Note interne…"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => run(`dispute-${d.id}-refund`, () => apiPost("resolve_dispute", {
                      taskId: d.id, decision: "refund_writer", note: decisionNote[d.id] || undefined,
                    }))}
                    disabled={busy === `dispute-${d.id}-refund`}
                    className="px-5 py-2.5 rounded-xl text-sm font-black bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    Rembourser l&apos;écrivain
                  </button>
                  <button
                    onClick={() => run(`dispute-${d.id}-pay`, () => apiPost("resolve_dispute", {
                      taskId: d.id, decision: "pay_pro", note: decisionNote[d.id] || undefined,
                    }))}
                    disabled={busy === `dispute-${d.id}-pay`}
                    className="px-5 py-2.5 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Payer le professionnel
                  </button>
                  <button
                    onClick={() => run(`dispute-${d.id}-split`, () => apiPost("resolve_dispute", {
                      taskId: d.id,
                      decision: "split",
                      proAmount: parseFloat(splitAmount[d.id]),
                      note: decisionNote[d.id] || undefined,
                    }))}
                    disabled={busy === `dispute-${d.id}-split`}
                    className="px-5 py-2.5 rounded-xl text-sm font-black bg-white border border-slate-200 text-slate-700 hover:border-teal-500 disabled:opacity-50"
                  >
                    Partager
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      {/* Paiements */}
      <AdminSection title={`Paiements (${payouts.length})`} icon={Play}>
        <button
          onClick={() => run("run-payouts", () => apiPost("admin_run_payouts", {}))}
          disabled={busy === "run-payouts"}
          className="mb-6 inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-teal-700 transition-all disabled:opacity-50"
        >
          <Play size={16} /> {busy === "run-payouts" ? "Exécution…" : "Exécuter les paiements en attente"}
        </button>
        {payouts.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucun paiement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Mission</th>
                  <th className="py-3 pr-4">Professionnel</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4">Référence</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-600">{formatDateFR(p.at)}</td>
                    <td className="py-3 pr-4">
                      <Link href={`/marketplace/missions/${p.taskId}`} className="font-bold text-teal-700 hover:underline">
                        {p.taskId.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-700">{p.proEmail}</td>
                    <td className="py-3 pr-4 font-black"><Money amount={p.amount} currency={p.currency || "CAD"} /></td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        p.status === "completed" ? "bg-emerald-50 text-emerald-700"
                        : p.status === "manual" ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                      }`}>
                        {p.status === "completed" ? "Payé" : p.status === "manual" ? "Manuel" : p.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-600">{p.reference || p.batchId || "—"}</td>
                    <td className="py-3">
                      {p.status !== "completed" && p.status !== "manual" && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={manualRef[p.id] ?? ""}
                            onChange={(e) => setManualRef((s) => ({ ...s, [p.id]: e.target.value }))}
                            placeholder="Référence…"
                            className="w-28 px-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => {
                              const ref = (manualRef[p.id] || "").trim();
                              if (!ref) { setError("Veuillez saisir une référence pour le paiement manuel."); return; }
                              run(`manual-${p.id}`, () => apiPost("admin_mark_payout_manual", { payoutId: p.id, reference: ref }));
                            }}
                            disabled={busy === `manual-${p.id}`}
                            className="px-4 py-1.5 rounded-xl text-xs font-black bg-white border border-slate-200 text-slate-700 hover:border-teal-500 disabled:opacity-50"
                          >
                            Marquer comme manuel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      {/* Ledger */}
      <AdminSection title={`Journal comptable (${ledger.length})`} icon={ShieldAlert}>
        {ledger.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucune entrée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Mission</th>
                  <th className="py-3 pr-4">Acteur</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3">Détail</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-600 whitespace-nowrap">{formatDateFR(e.at)}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-600">{e.type}</span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-700">{e.taskId ? e.taskId.slice(0, 8) + "…" : "—"}</td>
                    <td className="py-3 pr-4 font-medium text-slate-600">{e.actor || "—"}</td>
                    <td className="py-3 pr-4 font-black">{e.amount != null ? <Money amount={e.amount} currency={e.currency || "CAD"} /> : "—"}</td>
                    <td className="py-3 text-slate-600">{e.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      {/* Pros */}
      <AdminSection title={`Professionnels (${pros.length})`} icon={BadgeCheck}>
        {pros.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucun professionnel inscrit.</p>
        ) : (
          <div className="space-y-3">
            {pros.map((p) => (
              <div key={p.email} className="bg-slate-50 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/marketplace/pro/${encodeURIComponent(p.email)}`} className="font-black text-slate-900 hover:text-teal-700 hover:underline">
                      {p.name}
                    </Link>
                    {p.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                        <BadgeCheck size={13} /> Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
                        <Ban size={13} /> Non vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {p.email} · {p.completedCount || 0} missions terminées · {p.missedDeadlines || 0} échéances manquées
                  </p>
                </div>
                <button
                  onClick={() => run(`verify-${p.email}`, () => apiPost("admin_verify_pro", { email: p.email, verified: !p.verified }))}
                  disabled={busy === `verify-${p.email}`}
                  className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all disabled:opacity-50 ${
                    p.verified ? "bg-white border border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-600"
                    : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  {p.verified ? "Suspendre" : "Vérifier"}
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}

function AdminSection({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-5 inline-flex items-center gap-2">
        <Icon size={15} /> {title}
      </h2>
      {children}
    </div>
  );
}
