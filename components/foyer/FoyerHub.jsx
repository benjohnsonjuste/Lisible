"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Flame, Timer, Trophy, HeartHandshake, Users, Plus, Play,
  ChevronRight, Sparkles, Target, CalendarDays, Send, Loader2,
  CheckCircle2, Hourglass, Flag, PenLine, Quote
} from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "rituel", label: "Mon rituel", icon: <Flame size={16} /> },
  { id: "sprints", label: "Sprints en direct", icon: <Timer size={16} /> },
  { id: "defis", label: "Défis & saisons", icon: <Trophy size={16} /> },
  { id: "mur", label: "Mur d'encouragements", icon: <HeartHandshake size={16} /> },
  { id: "cercles", label: "Cercles", icon: <Users size={16} /> },
];

function useCurrentUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const u = localStorage.getItem("lisible_user");
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, []);
  return user;
}

async function apiGet(type, email) {
  const q = email ? `&email=${encodeURIComponent(email)}` : "";
  const r = await fetch(`/api/foyer?type=${type}${q}`, { cache: "no-store" });
  if (!r.ok) throw new Error("Le Foyer est momentanément inaccessible.");
  return r.json();
}

async function apiPost(action, payload) {
  const r = await fetch("/api/foyer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Une erreur est survenue.");
  return j;
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }); }
  catch { return ""; }
}

function countdown(targetIso) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return null;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} j ${h % 24} h`;
  if (h > 0) return `${h} h ${m % 60} min`;
  return `${m} min`;
}

// ─── Onglet : Mon rituel ────────────────────────────────────────────────────
function RituelTab({ user }) {
  const [rituel, setRituel] = useState(null);
  const [words, setWords] = useState("");
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState(500);

  useEffect(() => {
    try {
      const g = localStorage.getItem("foyer_daily_goal");
      if (g) setGoal(Number(g) || 500);
    } catch {}
    if (user?.email) apiGet("rituel", user.email).then(j => setRituel(j.rituel)).catch(() => {});
  }, [user]);

  const saveGoal = (v) => {
    setGoal(v);
    try { localStorage.setItem("foyer_daily_goal", String(v)); } catch {}
  };

  const logDay = async () => {
    if (!user) return toast.error("Connectez-vous pour allumer votre flamme.");
    const w = Number(words);
    if (!w || w <= 0) return toast.error("Indiquez le nombre de mots écrits aujourd'hui.");
    setSaving(true);
    try {
      const j = await apiPost("log_day", { userEmail: user.email, userName: user.penName || user.name, words: w });
      setRituel(j.rituel);
      setWords("");
      toast.success(w >= goal ? "Objectif du jour atteint. Quelle plume ! 🔥" : "Journée enregistrée. Chaque mot compte.");
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const maxWeek = Math.max(1, ...(rituel?.week || []).map(w => w.words));
  const progress = Math.min(100, Math.round(((rituel?.todayWords || 0) / goal) * 100));

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <Flame size={160} className="absolute -right-6 -bottom-6 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-80 mb-2">Série en cours</p>
        <div className="flex items-end gap-3">
          <span className="text-7xl font-black italic leading-none">{rituel?.streak || 0}</span>
          <span className="text-lg font-bold mb-1">jour{(rituel?.streak || 0) > 1 ? "s" : ""} d'affilée</span>
        </div>
        <p className="mt-4 text-sm opacity-90 leading-relaxed">
          {rituel?.streak >= 7 ? "Une vraie discipline d'écrivain. Le Foyer vous salue."
            : rituel?.streak >= 1 ? "La flamme est allumée. Revenez demain pour la nourrir."
            : "Écrivez aujourd'hui pour allumer votre première flamme."}
        </p>
        <div className="mt-6 bg-white/15 rounded-2xl p-4 backdrop-blur">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
            <span>Aujourd'hui</span><span>{rituel?.todayWords || 0} / {goal} mots</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
        <h3 className="text-xl font-black italic text-slate-900 mb-1 flex items-center gap-2"><PenLine size={20} className="text-orange-500" /> Journal du jour</h3>
        <p className="text-sm text-slate-500 mb-6">Combien de mots avez-vous écrits aujourd'hui ?</p>
        <div className="flex gap-3">
          <input
            type="number" min="1" value={words} onChange={e => setWords(e.target.value)}
            placeholder="ex. 750"
            className="grow bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-2xl outline-none focus:border-orange-400 transition-all"
          />
          <button onClick={logDay} disabled={saving}
            className="px-8 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Enregistrer
          </button>
        </div>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <Target size={16} className="text-slate-400" />
          <span className="text-slate-500 font-bold">Objectif quotidien :</span>
          <input type="number" min="50" step="50" value={goal} onChange={e => saveGoal(Number(e.target.value) || 500)}
            className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-black text-center outline-none focus:border-orange-400" />
          <span className="text-slate-500 font-bold">mots</span>
        </div>
        <div className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">Les 7 derniers jours</p>
          <div className="flex items-end gap-2 h-28">
            {(rituel?.week || []).map((d, i) => (
              <div key={i} className="grow flex flex-col items-center gap-2">
                <div className="w-full bg-slate-100 rounded-xl relative overflow-hidden" style={{ height: "100%" }}>
                  <div className={`absolute bottom-0 w-full rounded-xl transition-all ${d.words > 0 ? "bg-gradient-to-t from-orange-500 to-amber-400" : "bg-transparent"}`}
                    style={{ height: `${Math.max(d.words > 0 ? 8 : 0, (d.words / maxWeek) * 100)}%` }} />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500"><span className="font-black text-slate-900">{(rituel?.totalWords || 0).toLocaleString("fr-FR")}</span> mots écrits au total depuis votre arrivée au Foyer.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Onglet : Sprints ─────────────────────────────────────────────────────────
function SprintCard({ sprint, user, onRefresh }) {
  const [declaring, setDeclaring] = useState(false);
  const [words, setWords] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (sprint.status === "done") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sprint.status]);

  const start = new Date(sprint.startAt).getTime();
  const end = start + sprint.durationMin * 60000;
  const isLive = sprint.status === "live" && now < end;
  const remaining = Math.max(0, end - now);
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const me = sprint.participants.find(p => p.email === user?.email?.toLowerCase());
  const finished = sprint.participants.filter(p => p.words != null).sort((a, b) => b.words - a.words);

  const join = async () => {
    if (!user) return toast.error("Connectez-vous pour rejoindre un sprint.");
    setBusy(true);
    try { await apiPost("join_sprint", { userEmail: user.email, userName: user.penName || user.name, sprintId: sprint.id }); toast.success("Vous êtes dans le sprint !"); onRefresh(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const declareWords = async () => {
    const w = Number(words);
    if (!w || w < 0) return toast.error("Indiquez vos mots.");
    setBusy(true);
    try {
      await apiPost("declare_words", { userEmail: user.email, userName: user.penName || user.name, sprintId: sprint.id, words: w });
      toast.success("Bravo ! Vos mots sont comptés.");
      setDeclaring(false); setWords(""); onRefresh();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className={`bg-white rounded-[2rem] p-6 border-2 shadow-lg relative overflow-hidden ${isLive ? "border-orange-400" : "border-slate-100"}`}>
      {isLive && <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse" />}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h4 className="font-black text-lg text-slate-900 leading-tight">{sprint.title}</h4>
          <p className="text-xs text-slate-500 mt-1">Animé par <span className="font-bold text-slate-700">{sprint.hostName}</span> · {sprint.durationMin} min</p>
        </div>
        {isLive ? (
          <span className="shrink-0 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full animate-pulse">En direct · {mm}:{ss}</span>
        ) : sprint.status === "scheduled" ? (
          <span className="shrink-0 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-1.5"><Hourglass size={12} /> Dans {countdown(sprint.startAt) || "quelques instants"}</span>
        ) : (
          <span className="shrink-0 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">Terminé</span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500">{sprint.participants.length} plume{sprint.participants.length > 1 ? "s" : ""}</span>
        <div className="flex -space-x-2 ml-2">
          {sprint.participants.slice(0, 6).map((p, i) => (
            <div key={i} title={p.name} className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 border-2 border-white flex items-center justify-center text-white text-[10px] font-black">
              {p.name?.charAt(0)?.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {sprint.status !== "done" && !me && (
        <button onClick={join} disabled={busy} className="w-full py-3.5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Rejoindre le sprint
        </button>
      )}
      {sprint.status !== "done" && me && me.words == null && (
        <button onClick={() => setDeclaring(!declaring)} className="w-full py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all">
          Déclarer mes mots
        </button>
      )}
      {declaring && (
        <div className="mt-3 flex gap-2">
          <input type="number" min="0" value={words} onChange={e => setWords(e.target.value)} placeholder="Mots écrits"
            className="grow bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-black outline-none focus:border-orange-400" />
          <button onClick={declareWords} disabled={busy} className="px-6 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : "OK"}
          </button>
        </div>
      )}
      {me?.words != null && <p className="text-xs font-bold text-teal-700 bg-teal-50 rounded-xl px-4 py-2.5 mt-1">✓ Vous avez écrit {me.words.toLocaleString("fr-FR")} mots pendant ce sprint.</p>}

      {finished.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Résultats</p>
          {finished.slice(0, 5).map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 text-sm">
              <span className="font-bold text-slate-700">{i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "· "}{p.name}</span>
              <span className="font-black text-slate-900">{p.words.toLocaleString("fr-FR")} mots</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SprintsTab({ user }) {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", durationMin: 25, startsInMin: 5 });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try { const j = await apiGet("sprints"); setSprints(j.sprints || []); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  const create = async () => {
    if (!user) return toast.error("Connectez-vous pour animer un sprint.");
    if (!form.title.trim()) return toast.error("Donnez un titre à votre sprint.");
    setBusy(true);
    try {
      await apiPost("create_sprint", { userEmail: user.email, userName: user.penName || user.name, ...form });
      toast.success("Sprint créé ! Les plumes peuvent le rejoindre.");
      setShowCreate(false); setForm({ title: "", durationMin: 25, startsInMin: 5 }); refresh();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <p className="text-slate-500 text-sm max-w-xl">Des salons d'écriture silencieux avec minuteur partagé : on écrit ensemble, chacun chez soi, et on célèbre les mots à la fin.</p>
        <button onClick={() => setShowCreate(!showCreate)} className="px-6 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg">
          <Plus size={16} /> Animer un sprint
        </button>
      </div>

      {showCreate && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 mb-6 grid md:grid-cols-4 gap-4">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titre du sprint (ex. Sprint du matin)"
            className="md:col-span-2 bg-white border-2 border-amber-100 rounded-2xl px-5 py-3.5 font-bold outline-none focus:border-orange-400" />
          <select value={form.durationMin} onChange={e => setForm({ ...form, durationMin: Number(e.target.value) })}
            className="bg-white border-2 border-amber-100 rounded-2xl px-5 py-3.5 font-bold outline-none focus:border-orange-400">
            <option value={10}>10 minutes</option><option value={15}>15 minutes</option>
            <option value={25}>25 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option>
          </select>
          <select value={form.startsInMin} onChange={e => setForm({ ...form, startsInMin: Number(e.target.value) })}
            className="bg-white border-2 border-amber-100 rounded-2xl px-5 py-3.5 font-bold outline-none focus:border-orange-400">
            <option value={0}>Démarre maintenant</option><option value={5}>Dans 5 min</option>
            <option value={15}>Dans 15 min</option><option value={30}>Dans 30 min</option><option value={60}>Dans 1 h</option>
          </select>
          <button onClick={create} disabled={busy} className="md:col-span-4 py-3.5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Lancer le sprint"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
      ) : sprints.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-16 text-center">
          <Timer size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="font-black text-slate-700 text-lg mb-2">Aucun sprint pour le moment</p>
          <p className="text-sm text-slate-500">Soyez la première plume à animer un sprint : les autres vous rejoindront.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {sprints.map(s => <SprintCard key={s.id} sprint={s} user={user} onRefresh={refresh} />)}
        </div>
      )}
    </div>
  );
}

// ─── Onglet : Défis & saisons ────────────────────────────────────────────────
function DefisTab({ user }) {
  const [challenges, setChallenges] = useState([]);
  const [rituel, setRituel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const j = await apiGet("challenges");
        setChallenges(j.challenges || []);
        if (user?.email) {
          const r = await apiGet("rituel", user.email);
          setRituel(r.rituel);
        }
      } catch (e) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const wordsSince = (ch) => {
    if (!rituel?.days) return 0;
    const start = ch.startDate || (() => { const d = new Date(); d.setDate(d.getDate() - (ch.rollingDays || 7)); return d.toISOString().slice(0, 10); })();
    return rituel.days.filter(d => d.date >= start).reduce((a, d) => a + Number(d.words || 0), 0);
  };

  const join = async (id) => {
    if (!user) return toast.error("Connectez-vous pour relever un défi.");
    setBusy(id);
    try {
      const j = await apiPost("join_challenge", { userEmail: user.email, userName: user.penName || user.name, challengeId: id });
      setChallenges(prev => prev.map(c => c.id === id ? j.challenge : c));
      toast.success("Défi relevé ! Le Foyer compte sur vous. 🔥");
    } catch (e) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {challenges.map(ch => {
        const joined = ch.participants.some(p => p.email === user?.email?.toLowerCase());
        const mine = wordsSince(ch);
        const pct = Math.min(100, Math.round((mine / ch.goalWords) * 100));
        const remaining = ch.endDate ? countdown(ch.endDate + "T23:59:59") : null;
        return (
          <div key={ch.id} className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-xl flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 ${ch.kind === "saison" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-teal-500 to-emerald-500"}`} />
            <span className={`self-start text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-4 ${ch.kind === "saison" ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"}`}>
              {ch.kind === "saison" ? "Saison" : "Défi"}
            </span>
            <h4 className="font-black text-xl text-slate-900 leading-tight mb-2">{ch.title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-4 grow">{ch.description}</p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-3">
              <span className="flex items-center gap-1.5"><Flag size={13} className="text-slate-400" />{(ch.goalWords || 0).toLocaleString("fr-FR")} mots</span>
              {ch.startDate && <span className="flex items-center gap-1.5"><CalendarDays size={13} className="text-slate-400" />{fmtDate(ch.startDate)} → {fmtDate(ch.endDate)}</span>}
              {remaining && <span className="flex items-center gap-1.5"><Hourglass size={13} className="text-slate-400" />{remaining}</span>}
            </div>
            {joined && (
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                  <span>Ma progression</span><span>{mine.toLocaleString("fr-FR")} / {ch.goalWords.toLocaleString("fr-FR")}</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mt-auto pt-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Users size={13} />{ch.participants.length} participant{ch.participants.length > 1 ? "s" : ""}</span>
              {joined ? (
                <span className="px-5 py-2.5 bg-teal-50 text-teal-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={13} /> Relevé</span>
              ) : (
                <button onClick={() => join(ch.id)} disabled={busy === ch.id}
                  className="px-5 py-2.5 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50">
                  {busy === ch.id ? <Loader2 size={13} className="animate-spin" /> : "Relever le défi"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Onglet : Mur d'encouragements ───────────────────────────────────────────
function MurTab({ user, authors }) {
  const [mur, setMur] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try { const j = await apiGet("mur"); setMur(j.mur || []); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const send = async () => {
    if (!user) return toast.error("Connectez-vous pour encourager.");
    if (!message.trim()) return toast.error("Écrivez votre encouragement.");
    const target = authors.find(a => a.email === toEmail);
    setBusy(true);
    try {
      await apiPost("send_kudos", {
        userEmail: user.email, userName: user.penName || user.name,
        message: message.trim(), toEmail: target?.email || null, toName: target?.name || "toute la communauté"
      });
      setMessage(""); setToEmail("");
      toast.success("Votre encouragement réchauffe le Foyer. 🔥");
      refresh();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-xl h-fit">
        <h3 className="font-black italic text-xl text-slate-900 mb-1">Envoyer un encouragement</h3>
        <p className="text-sm text-slate-500 mb-5">Un mot gentil vaut mille pages.</p>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destinataire</label>
        <select value={toEmail} onChange={e => setToEmail(e.target.value)}
          className="w-full mt-2 mb-4 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:border-orange-400">
          <option value="">Toute la communauté</option>
          {authors.filter(a => a.email !== user?.email?.toLowerCase()).slice(0, 200).map(a => (
            <option key={a.email} value={a.email}>{a.name}</option>
          ))}
        </select>
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Votre message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={280} rows={4}
          placeholder="Ex. Bravo pour ta régularité, ta plume inspire le Foyer !"
          className="w-full mt-2 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-orange-400 resize-none" />
        <button onClick={send} disabled={busy}
          className="w-full mt-4 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Envoyer au Foyer
        </button>
      </div>
      <div className="lg:col-span-2 space-y-4 max-h-[640px] overflow-y-auto pr-1">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
          : mur.map(k => (
            <div key={k.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-md">
              <Quote size={18} className="text-amber-400 mb-2" />
              <p className="text-slate-800 leading-relaxed mb-3">{k.message}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-900">{k.fromName} <span className="font-medium text-slate-400">→ {k.toName}</span></span>
                <span className="text-slate-400 font-bold">{fmtDate(k.date)}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── Onglet : Cercles ────────────────────────────────────────────────────────
function CerclesTab({ user }) {
  const [cercles, setCercles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const refresh = async () => {
    try { const j = await apiGet("cercles"); setCercles(j.cercles || []); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const toggle = async (c) => {
    if (!user) return toast.error("Connectez-vous pour rejoindre un cercle.");
    const joined = (c.members || []).some(m => m.email === user.email.toLowerCase());
    setBusy(c.id);
    try {
      const j = await apiPost(joined ? "leave_cercle" : "join_cercle", { userEmail: user.email, userName: user.penName || user.name, cercleId: c.id });
      setCercles(prev => prev.map(x => x.id === c.id ? j.cercle : x));
      toast.success(joined ? "Vous avez quitté le cercle." : `Bienvenue dans « ${c.name} » !`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {cercles.map(c => {
        const joined = (c.members || []).some(m => m.email === user?.email?.toLowerCase());
        return (
          <div key={c.id} className="bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-xl flex flex-col">
            <span className="text-4xl mb-4">{c.emoji}</span>
            <h4 className="font-black text-lg text-slate-900 mb-1">{c.name}</h4>
            <p className="text-sm text-slate-500 mb-5 grow">{c.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Users size={13} />{(c.members || []).length} membre{(c.members || []).length > 1 ? "s" : ""}</span>
              <button onClick={() => toggle(c)} disabled={busy === c.id}
                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${joined ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-950 text-white hover:bg-orange-600"}`}>
                {busy === c.id ? <Loader2 size={13} className="animate-spin" /> : joined ? "Quitter" : "Rejoindre"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hub principal ───────────────────────────────────────────────────────────
export default function FoyerHub({ authors = [] }) {
  const user = useCurrentUser();
  const [tab, setTab] = useState("rituel");

  return (
    <div>
      <div className="bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden mb-10 shadow-2xl">
        <Flame size={220} className="absolute -right-10 -top-10 opacity-10" />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-3 flex items-center gap-2"><Sparkles size={14} /> Nouveau · Le rituel des plumes</p>
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-none mb-4">Le Foyer<span className="text-amber-400">.</span></h2>
          <p className="text-slate-300 max-w-2xl leading-relaxed text-sm md:text-base">
            L'endroit où les écrivains se retrouvent chaque jour : allumez votre série d'écriture,
            lancez un sprint en direct, relevez les défis de saison, encouragez les autres plumes
            et trouvez votre cercle. Écrire seul, ensemble.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${tab === t.id ? "bg-slate-950 text-white shadow-xl" : "bg-white text-slate-500 border border-slate-200 hover:border-orange-300 hover:text-orange-600"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "rituel" && <RituelTab user={user} />}
      {tab === "sprints" && <SprintsTab user={user} />}
      {tab === "defis" && <DefisTab user={user} />}
      {tab === "mur" && <MurTab user={user} authors={authors} />}
      {tab === "cercles" && <CerclesTab user={user} />}

      {!user && (
        <p className="mt-8 text-center text-sm text-slate-400">
          <a href="/login" className="font-black text-orange-600 underline underline-offset-4">Connectez-vous</a> pour allumer votre flamme et participer aux rituels du Foyer.
        </p>
      )}
    </div>
  );
}
