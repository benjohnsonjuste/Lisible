"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tag, CalendarDays, FileText, ExternalLink, Send, Star,
  AlertTriangle, CheckCircle2, Package, Clock, MessageSquare,
} from "lucide-react";
import { apiGet, apiPost, getSessionToken, getSessionUser, formatDateFR } from "@/components/freelance/api";
import StatusBadge from "@/components/freelance/StatusBadge";
import Money from "@/components/freelance/Money";
import Timeline from "@/components/freelance/Timeline";

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
function maxDateISO() {
  const d = new Date();
  d.setDate(d.getDate() + 120);
  return d.toISOString().slice(0, 10);
}

export default function MissionPage({ params }) {
  const { id } = React.use(params);
  const router = useRouter();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);
  const [proProfile, setProProfile] = useState(null);

  // Formulaires
  const [deadline, setDeadline] = useState("");
  const [deliverLink, setDeliverLink] = useState("");
  const [deliverNote, setDeliverNote] = useState("");
  const [extDays, setExtDays] = useState(3);
  const [extReason, setExtReason] = useState("");
  const [revisionMsg, setRevisionMsg] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [msgText, setMsgText] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTarget, setReviewTarget] = useState("pro");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await apiGet("get_task", { id });
      setTask(j.task);
      if (getSessionToken()) {
        try {
          const dash = await apiGet("dashboard", { sessionToken: getSessionToken() });
          setProProfile(dash.proProfile || null);
        } catch { /* pas bloquant */ }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function run(key, fn) {
    setBusy(key);
    setNotice(null);
    setError(null);
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

  const user = getSessionUser();
  const myEmail = user?.email || null;
  const isWriter = task && myEmail && task.writerEmail === myEmail;
  const isPro = task && myEmail && task.proEmail === myEmail;
  const isParty = isWriter || isPro;
  const pendingExt = (task?.extensions || []).find((x) => x.status === "pending");

  function payAndPublish() {
    return run("pay", async () => {
      if (!getSessionToken()) { router.push("/login"); return; }
      const order = await apiPost("create_paypal_order", { taskId: id });
      window.location.href = order.approveUrl;
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      <Link href="/marketplace" className="text-sm font-bold text-teal-700 hover:underline mb-6 inline-block">
        ← Retour à l&apos;Espace Freelance
      </Link>

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

      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium mt-4">Chargement de la mission…</p>
        </div>
      )}

      {!loading && task && (
        <>
          {/* En-tête */}
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <StatusBadge status={task.status} />
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <Tag size={13} className="text-teal-600" /> {task.category}
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900">{task.title}</h1>
                <p className="text-sm text-slate-500 font-medium mt-2">
                  Publiée par {task.writerName || "—"} · {formatDateFR(task.createdAt)}
                </p>
              </div>
              <Money amount={task.budget} currency={task.currency || "CAD"} className="text-3xl font-black text-teal-700" />
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-6 text-sm">
              <Info icon={FileText} label="Nombre de mots" value={task.wordCount ? Number(task.wordCount).toLocaleString("fr-CA") : "—"} />
              <Info icon={CalendarDays} label="Remise souhaitée" value={task.desiredDate ? formatDateFR(task.desiredDate) : "—"} />
              <Info icon={Clock} label="Échéance convenue" value={task.deadline ? formatDateFR(task.deadline) : "—"} />
            </div>

            {task.briefLink && (
              <a href={task.briefLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-teal-700 hover:underline">
                <ExternalLink size={15} /> Voir le brief
              </a>
            )}

            {task.status === "assigned" && task.escrow?.status === "held" && (
              <p className="mt-4 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3">
                Séquestre actif : {<Money amount={task.escrow.amount} currency={task.currency || "CAD"} />} conservés jusqu&apos;à validation.
              </p>
            )}
          </div>

          {/* Description */}
          <Section title="Description">
            <p className="text-slate-700 whitespace-pre-line leading-relaxed">{task.description}</p>
          </Section>

          {/* Panneaux d'action */}
          <ActionPanels
            task={task} isWriter={isWriter} isPro={isPro} isParty={isParty} pendingExt={pendingExt}
            proProfile={proProfile} busy={busy}
            deadline={deadline} setDeadline={setDeadline}
            deliverLink={deliverLink} setDeliverLink={setDeliverLink}
            deliverNote={deliverNote} setDeliverNote={setDeliverNote}
            extDays={extDays} setExtDays={setExtDays}
            extReason={extReason} setExtReason={setExtReason}
            revisionMsg={revisionMsg} setRevisionMsg={setRevisionMsg}
            disputeReason={disputeReason} setDisputeReason={setDisputeReason}
            run={run}
          />

          {/* Livrable */}
          {isParty && task.deliverable && (
            <Section title="Livrable">
              <a href={task.deliverable.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-teal-700 hover:underline mb-2">
                <Package size={16} /> Ouvrir le livrable <ExternalLink size={14} />
              </a>
              {task.deliverable.note && <p className="text-sm text-slate-600 whitespace-pre-line">{task.deliverable.note}</p>}
              <p className="text-xs text-slate-400 mt-2">Livré le {formatDateFR(task.deliverable.deliveredAt)}</p>
            </Section>
          )}

          {/* Messages */}
          {isParty && (
            <Section title="Messages">
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-1">
                {(task.messages || []).length === 0 && (
                  <p className="text-sm text-slate-400 italic">Aucun message pour le moment.</p>
                )}
                {(task.messages || []).map((m) => {
                  const mine = m.authorEmail === myEmail;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${mine ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                        <p className="text-xs font-bold opacity-70 mb-1">{m.authorName || m.authorEmail}</p>
                        <p className="text-sm whitespace-pre-line">{m.text}</p>
                        <p className={`text-[11px] mt-1 ${mine ? "text-teal-100" : "text-slate-400"}`}>{formatDateFR(m.at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!msgText.trim()) return;
                  run("message", async () => {
                    await apiPost("post_message", { taskId: id, text: msgText.trim() });
                    setMsgText("");
                  });
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Écrire un message…"
                  className="flex-1 px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm"
                />
                <button
                  type="submit"
                  disabled={busy === "message" || !msgText.trim()}
                  className="bg-teal-600 text-white px-5 rounded-2xl hover:bg-teal-700 transition-all disabled:opacity-50"
                  aria-label="Envoyer le message"
                >
                  <Send size={18} />
                </button>
              </form>
            </Section>
          )}

          {/* Avis */}
          {task.status === "completed" && task.reviews && (
            <Section title="Avis">
              <div className="grid sm:grid-cols-2 gap-4">
                {task.reviews.pro && (
                  <ReviewCard label="Avis sur le professionnel" review={task.reviews.pro} />
                )}
                {task.reviews.writer && (
                  <ReviewCard label="Avis sur l'écrivain" review={task.reviews.writer} />
                )}
              </div>
            </Section>
          )}

          {/* Formulaire d'avis après mission terminée */}
          {isParty && task.status === "completed" && (
            <Section title="Laisser un avis">
              <div className="flex gap-2 mb-4">
                {["pro", "writer"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setReviewTarget(t)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-black ${
                      reviewTarget === t ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
                    }`}
                  >
                    {t === "pro" ? "Évaluer le pro" : "Évaluer l'écrivain"}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
                    <Star size={28} className={n <= rating ? "text-amber-500" : "text-slate-300"} fill={n <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Votre commentaire…"
                className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
              />
              <button
                onClick={() => run("review", async () => {
                  await apiPost("submit_review", { taskId: id, rating, comment: reviewComment.trim(), target: reviewTarget });
                  setReviewComment("");
                })}
                disabled={busy === "review"}
                className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-teal-700 transition-all disabled:opacity-50"
              >
                {busy === "review" ? "Envoi…" : "Publier l'avis"}
              </button>
            </Section>
          )}

          {/* Chronologie */}
          <Section title="Chronologie">
            <Timeline events={task.timeline || []} />
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1 inline-flex items-center gap-1.5">
        <Icon size={13} className="text-teal-600" /> {label}
      </p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ReviewCard({ label, review }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">{label}</p>
      <div className="flex gap-0.5 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={16} className={n <= review.rating ? "text-amber-500" : "text-slate-300"} fill={n <= review.rating ? "currentColor" : "none"} />
        ))}
      </div>
      {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
      <p className="text-xs text-slate-400 mt-2">{review.authorName} · {formatDateFR(review.at)}</p>
    </div>
  );
}

function ActionPanels(props) {
  const {
    task, isWriter, isPro, isParty, pendingExt, proProfile, busy,
    deadline, setDeadline, deliverLink, setDeliverLink, deliverNote, setDeliverNote,
    extDays, setExtDays, extReason, setExtReason, revisionMsg, setRevisionMsg,
    disputeReason, setDisputeReason, run,
  } = props;
  const id = task.id;
  const logged = !!getSessionToken();

  const panels = [];

  // Écrivain + brouillon → payer et publier
  if (isWriter && task.status === "draft") {
    panels.push(
      <Action key="pay" title="Mission en brouillon">
        <p className="text-sm text-slate-600 mb-4">Sécurisez le budget en séquestre pour publier votre mission.</p>
        <button onClick={() => props.run("pay", async () => {
          const order = await apiPost("create_paypal_order", { taskId: id });
          window.location.href = order.approveUrl;
        })} disabled={busy === "pay"} className="btn-primary">
          {busy === "pay" ? "Redirection…" : "Payer et publier la mission"}
        </button>
      </Action>
    );
  }

  // Connecté (pas l'écrivain) + mission ouverte → accepter
  if (logged && !isWriter && task.status === "open") {
    panels.push(
      <Action key="accept" title="Accepter la mission">
        {proProfile ? (
          <>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              Date de remise proposée
            </label>
            <input
              type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              min={tomorrowISO()} max={maxDateISO()}
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
            />
            <button onClick={() => run("accept", async () => {
              if (!deadline) throw new Error("Veuillez choisir une date de remise.");
              await apiPost("accept_task", { taskId: id, deadline: new Date(deadline).toISOString() });
            })} disabled={busy === "accept"} className="btn-primary">
              {busy === "accept" ? "En cours…" : "Accepter la mission"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-4">Vous devez avoir un profil professionnel pour accepter une mission.</p>
            <Link href="/marketplace/devenir-pro" className="btn-primary inline-block text-center">Devenir pro</Link>
          </>
        )}
      </Action>
    );
  }

  // Pro + en cours → livrer / demander prolongation
  if (isPro && task.status === "assigned") {
    panels.push(
      <Action key="deliver" title="Livrer le travail">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Lien du livrable (https)</label>
        <input
          type="url" value={deliverLink} onChange={(e) => setDeliverLink(e.target.value)}
          placeholder="https://…"
          className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
        />
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Note (optionnel)</label>
        <textarea
          value={deliverNote} onChange={(e) => setDeliverNote(e.target.value)} rows={3}
          placeholder="Précisions sur le livrable…"
          className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
        />
        <button onClick={() => run("deliver", async () => {
          if (!deliverLink.trim()) throw new Error("Veuillez saisir le lien du livrable.");
          await apiPost("deliver", { taskId: id, deliverableLink: deliverLink.trim(), note: deliverNote.trim() });
          setDeliverLink(""); setDeliverNote("");
        })} disabled={busy === "deliver"} className="btn-primary">
          <span className="inline-flex items-center gap-2"><Package size={16} /> {busy === "deliver" ? "Envoi…" : "Livrer le travail"}</span>
        </button>
      </Action>
    );
    if (!pendingExt) {
      panels.push(
        <Action key="ext" title="Demander une prolongation">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Jours supplémentaires (1 à 7)</label>
          <input
            type="number" min={1} max={7} value={extDays} onChange={(e) => setExtDays(parseInt(e.target.value, 10) || 1)}
            className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
          />
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Motif</label>
          <textarea
            value={extReason} onChange={(e) => setExtReason(e.target.value)} rows={2}
            placeholder="Expliquez pourquoi vous avez besoin de plus de temps…"
            className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
          />
          <button onClick={() => run("ext", async () => {
            if (!extReason.trim()) throw new Error("Veuillez indiquer un motif.");
            await apiPost("request_extension", { taskId: id, days: extDays, reason: extReason.trim() });
            setExtReason("");
          })} disabled={busy === "ext"} className="btn-secondary">
            {busy === "ext" ? "Envoi…" : "Demander une prolongation"}
          </button>
        </Action>
      );
    }
  }

  // Écrivain + prolongation en attente → trancher
  if (isWriter && pendingExt) {
    panels.push(
      <Action key="ext-decide" title="Prolongation demandée">
        <p className="text-sm text-slate-600 mb-2">
          Le professionnel demande <strong>{pendingExt.days} jour{pendingExt.days > 1 ? "s" : ""}</strong> supplémentaires.
        </p>
        <p className="text-sm text-slate-500 italic mb-4">Motif : {pendingExt.reason}</p>
        <div className="flex gap-3">
          <button onClick={() => run("ext-ok", () => apiPost("respond_extension", { taskId: id, extensionId: pendingExt.id, approve: true }))}
            disabled={busy === "ext-ok"} className="btn-primary flex-1">Accepter</button>
          <button onClick={() => run("ext-ko", () => apiPost("respond_extension", { taskId: id, extensionId: pendingExt.id, approve: false }))}
            disabled={busy === "ext-ko"} className="btn-danger flex-1">Refuser</button>
        </div>
      </Action>
    );
  }

  // Écrivain + livré → valider / demander révision
  if (isWriter && task.status === "delivered") {
    panels.push(
      <Action key="validate" title="Valider le travail">
        <p className="text-sm text-slate-600 mb-4">La validation libère le paiement au professionnel.</p>
        <button onClick={() => run("validate", () => apiPost("validate", { taskId: id }))}
          disabled={busy === "validate"} className="btn-primary">
          <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> {busy === "validate" ? "En cours…" : "Valider le travail"}</span>
        </button>
      </Action>
    );
    panels.push(
      <Action key="revision" title="Demander une révision">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Message au professionnel</label>
        <textarea
          value={revisionMsg} onChange={(e) => setRevisionMsg(e.target.value)} rows={3}
          placeholder="Décrivez les corrections souhaitées…"
          className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
        />
        <button onClick={() => run("revision", async () => {
          if (!revisionMsg.trim()) throw new Error("Veuillez décrire les corrections souhaitées.");
          await apiPost("request_revision", { taskId: id, message: revisionMsg.trim() });
          setRevisionMsg("");
        })} disabled={busy === "revision"} className="btn-secondary">
          {busy === "revision" ? "Envoi…" : "Demander une révision"}
        </button>
      </Action>
    );
  }

  // Parties + en cours ou livré → litige
  if (isParty && (task.status === "assigned" || task.status === "delivered")) {
    panels.push(
      <Action key="dispute" title="Ouvrir un litige">
        <p className="text-sm text-slate-600 mb-4">En cas de désaccord, notre équipe arbitrera la situation.</p>
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Motif du litige</label>
        <textarea
          value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} rows={3}
          placeholder="Expliquez la situation…"
          className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium text-sm mb-4"
        />
        <button onClick={() => run("dispute", async () => {
          if (!disputeReason.trim()) throw new Error("Veuillez indiquer un motif.");
          await apiPost("open_dispute", { taskId: id, reason: disputeReason.trim() });
        })} disabled={busy === "dispute"} className="btn-danger">
          {busy === "dispute" ? "En cours…" : "Ouvrir un litige"}
        </button>
      </Action>
    );
  }

  // Écrivain + brouillon/ouverte → annuler
  if (isWriter && (task.status === "draft" || task.status === "open")) {
    panels.push(
      <Action key="cancel" title="Annuler la mission">
        <button onClick={() => {
          if (window.confirm("Voulez-vous vraiment annuler cette mission ?")) {
            run("cancel", () => apiPost("cancel_task", { taskId: id }));
          }
        }} disabled={busy === "cancel"} className="btn-danger">
          {busy === "cancel" ? "En cours…" : "Annuler la mission"}
        </button>
      </Action>
    );
  }

  // Bloc litige
  if (task.status === "disputed") {
    panels.push(
      <Action key="disputed" title="Litige en cours">
        <p className="text-sm text-slate-600 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          Cette mission fait l&apos;objet d&apos;un litige. Notre équipe examine la situation et tranchera sous peu.
        </p>
      </Action>
    );
  }

  if (!panels.length) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-4">Actions</h2>
      <div className="grid sm:grid-cols-2 gap-5">{panels}</div>
      <style>{`
        .btn-primary { background:#0d9488; color:#fff; padding:.875rem 1.75rem; border-radius:1rem; font-weight:800; font-size:.9rem; transition:all .2s; }
        .btn-primary:hover { background:#0f766e; }
        .btn-primary:disabled { opacity:.5; }
        .btn-secondary { background:#fff; color:#1e293b; border:1px solid #e2e8f0; padding:.875rem 1.75rem; border-radius:1rem; font-weight:800; font-size:.9rem; transition:all .2s; }
        .btn-secondary:hover { border-color:#0d9488; color:#0f766e; }
        .btn-secondary:disabled { opacity:.5; }
        .btn-danger { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; padding:.875rem 1.75rem; border-radius:1rem; font-weight:800; font-size:.9rem; transition:all .2s; }
        .btn-danger:hover { background:#fee2e2; }
        .btn-danger:disabled { opacity:.5; }
      `}</style>
    </div>
  );
}

function Action({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-3">
        <span className="inline-flex items-center gap-2"><MessageSquare size={14} /> {title}</span>
      </h3>
      {children}
    </div>
  );
}
