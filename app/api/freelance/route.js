// API Espace Freelance — missions, séquestre PayPal, litiges, administration.
// L'identité est résolue UNIQUEMENT via sessionToken (jamais via un email client).
import { NextResponse } from "next/server";
import { getFile, getSafePath, updateFile, readJsonOr } from "../_lib/github.js";
import { getSessionUser } from "../_lib/session.js";
import {
  paymentsEnabled,
  isDemo,
  createOrder,
  captureOrder,
  refundCapture,
  createPayout,
  PayoutsDisabledError,
  CURRENCY,
} from "./paypal.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ---------------------------------------------------------------- configuration
const CATEGORIES = [
  "Relecture",
  "Correction",
  "Mise en pages",
  "Couverture",
  "Traduction",
  "Illustration",
  "Formatage e-book",
  "Transcription",
  "Coaching d'écriture",
  "Autre",
];
const FEE = (() => {
  const v = parseFloat(process.env.PLATFORM_FEE_PERCENT || "0.15");
  return Number.isFinite(v) && v >= 0 && v < 1 ? v : 0.15;
})();
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "cmo.lablitteraire7@gmail.com")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const SITE_URL = "https://lisible.biz";

const TASKS_DIR = "data/freelance/tasks";
const INDEX_PATH = "data/freelance/index.json";
const PROFILES_DIR = "data/freelance/profiles";
const LEDGER_PATH = "data/freelance/ledger.json";
const PAYOUTS_PATH = "data/freelance/payouts.json";

const taskPath = (id) => `${TASKS_DIR}/${id}.json`;
const profilePath = (email) => `${PROFILES_DIR}/${email.toLowerCase().trim().replace(/[@.]/g, "_")}.json`;

// ---------------------------------------------------------------- utilitaires
const err = (status, message) => NextResponse.json({ error: message }, { status });
const ok = (data = {}) => NextResponse.json({ ok: true, ...data });
const nowIso = () => new Date().toISOString();
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const uid = (p) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const feeSplit = (budget) => {
  const platformFee = round2(budget * FEE);
  const proAmount = round2(budget - platformFee);
  return { proAmount, platformFee };
};

const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const isUrl = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};
const isHttpsUrl = (v) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};
const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Limitation de débit best-effort : 30 requêtes/minute par IP+action.
const RL = new Map();
function rateLimit(req, action) {
  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "inconnue";
  const key = `${ip}:${action}`;
  const now = Date.now();
  const arr = (RL.get(key) || []).filter((t) => now - t < 60000);
  arr.push(now);
  RL.set(key, arr);
  return arr.length <= 30;
}

// ---------------------------------------------------------------- données
async function readTask(id) {
  const f = await getFile(taskPath(id));
  if (!f || f.isDir) return null;
  return { content: f.content, sha: f.sha };
}
async function saveTask(task, sha, message) {
  const r = await updateFile(taskPath(task.id), task, sha, message);
  return r;
}
function addTimeline(task, actor, event, detail) {
  if (!Array.isArray(task.timeline)) task.timeline = [];
  task.timeline.push({ at: nowIso(), actor, event, detail });
}

async function readIndex() {
  const { content, sha } = await readJsonOr(INDEX_PATH, []);
  return { items: Array.isArray(content) ? content : [], sha };
}
function indexEntry(task) {
  return {
    id: task.id,
    title: task.title,
    category: task.category,
    budget: task.budget,
    currency: task.currency,
    status: task.status,
    writerEmail: task.writerEmail,
    writerName: task.writerName,
    proEmail: task.proEmail || null,
    proName: task.proName || null,
    createdAt: task.createdAt,
    deadline: task.deadline || null,
    escrowStatus: task.escrow ? task.escrow.status : null,
  };
}
async function upsertIndex(task) {
  const { items, sha } = await readIndex();
  const i = items.findIndex((e) => e.id === task.id);
  if (i > -1) items[i] = indexEntry(task);
  else items.unshift(indexEntry(task));
  await updateFile(INDEX_PATH, items, sha, `📇 Index freelance: ${task.id}`);
}
async function removeFromIndex(taskId) {
  const { items, sha } = await readIndex();
  const next = items.filter((e) => e.id !== taskId);
  if (next.length !== items.length) await updateFile(INDEX_PATH, next, sha, `📇 Index freelance: retrait ${taskId}`);
}

async function getProfile(email) {
  const f = await getFile(profilePath(email));
  if (!f || f.isDir) return null;
  return { content: f.content, sha: f.sha };
}

async function appendLedger(entry) {
  const { content, sha } = await readJsonOr(LEDGER_PATH, []);
  const arr = Array.isArray(content) ? content : [];
  arr.push({ at: nowIso(), ...entry });
  await updateFile(LEDGER_PATH, arr, sha, `📒 Ledger freelance: ${entry.type}`);
}
async function readPayouts() {
  const { content, sha } = await readJsonOr(PAYOUTS_PATH, []);
  return { items: Array.isArray(content) ? content : [], sha };
}
async function savePayouts(items, sha, message) {
  await updateFile(PAYOUTS_PATH, items, sha, message);
}

// Notification dans le fichier utilisateur (motif existant du site).
async function pushNotif(email, { type = "info", message, link = null }) {
  try {
    const path = getSafePath(email);
    if (!path) return;
    const f = await getFile(path);
    if (!f || f.isDir) return;
    if (!Array.isArray(f.content.notifications)) f.content.notifications = [];
    f.content.notifications.unshift({
      id: uid("notif"),
      type,
      message,
      date: nowIso(),
      read: false,
      link,
    });
    await updateFile(path, f.content, f.sha, `🔔 Notif freelance`);
  } catch (e) {
    console.error("pushNotif:", e.message);
  }
}

// ---------------------------------------------------------------- sessions
async function requireSession(sessionToken) {
  const s = await getSessionUser(sessionToken);
  if (!s) throw { status: 401, message: "Session invalide ou expirée. Reconnectez-vous." };
  return s;
}
function requireAdmin(session) {
  if (!ADMIN_EMAILS.includes(session.email.toLowerCase()))
    throw { status: 403, message: "Accès réservé à l'administration." };
}

// ---------------------------------------------------------------- validation interne (partagée : écrivain, système, litige)
async function doValidate(task, { actor, actorName, rating = null, comment = null }) {
  const { proAmount, platformFee } = feeSplit(task.budget);
  task.escrow.status = "released";
  task.status = "completed";
  task.completedAt = nowIso();
  addTimeline(
    task,
    actor,
    "validate",
    `Travail validé par ${actorName}. ${proAmount.toFixed(2)} ${task.currency} versés au professionnel, ${platformFee.toFixed(2)} ${task.currency} de commission.`
  );
  await appendLedger({ type: "payout_pro", taskId: task.id, actor: task.proEmail, amount: proAmount, currency: task.currency, detail: `Versement professionnel (${task.proName})` });
  await appendLedger({ type: "platform_fee", taskId: task.id, actor: "platform", amount: platformFee, currency: task.currency, detail: `Commission Lisible (${Math.round(FEE * 100)} %)` });

  // File de paiements PayPal vers le professionnel
  const prof = await getProfile(task.proEmail);
  const proPaypalEmail = prof ? prof.content.paypalEmail : null;
  const { items, sha } = await readPayouts();
  items.push({
    id: uid("pay"),
    taskId: task.id,
    proEmail: task.proEmail,
    proPaypalEmail,
    amount: proAmount,
    currency: task.currency,
    status: "queued",
    at: nowIso(),
    batchId: null,
    reference: null,
  });
  await savePayouts(items, sha, `💸 Payout en file: ${task.id}`);

  // Profil du professionnel : compteur + note moyenne
  if (prof) {
    prof.content.completedCount = (prof.content.completedCount || 0) + 1;
    if (rating) {
      const n = prof.content.ratingCount || 0;
      prof.content.ratingAvg = round2(((prof.content.ratingAvg || 0) * n + rating) / (n + 1));
      prof.content.ratingCount = n + 1;
      if (!Array.isArray(task.reviews)) task.reviews = {};
      task.reviews.pro = { rating, comment: comment || "", at: nowIso(), authorEmail: task.writerEmail, authorName: task.writerName };
    }
    await updateFile(profilePath(task.proEmail), prof.content, prof.sha, `⭐ Mission terminée: ${task.id}`);
  } else if (rating) {
    if (!Array.isArray(task.reviews)) task.reviews = {};
    task.reviews.pro = { rating, comment: comment || "", at: nowIso(), authorEmail: task.writerEmail, authorName: task.writerName };
  }

  await saveTask(task, task._sha, `✅ Mission validée: ${task.id}`);
  await upsertIndex(task);
  await pushNotif(task.proEmail, { type: "freelance", message: `« ${task.title} » validé ! ${proAmount.toFixed(2)} ${task.currency} en cours de versement.`, link: `/marketplace/missions/${task.id}` });
  await pushNotif(task.writerEmail, { type: "freelance", message: `Vous avez validé « ${task.title} ». Merci !`, link: `/marketplace/missions/${task.id}` });
  return { proAmount, platformFee };
}

// ---------------------------------------------------------------- vérifications paresseuses (délais + validation auto)
async function applyLazyChecks(task) {
  let changed = false;
  const now = Date.now();

  // 1. Délai dépassé : la mission redevient disponible (sauf prolongation en attente)
  if (task.status === "assigned" && task.deadline && now > new Date(task.deadline).getTime()) {
    const pendingExt = (task.extensions || []).some((e) => e.status === "pending");
    if (!pendingExt) {
      const oldPro = task.proEmail;
      const oldProName = task.proName;
      task.lastProEmail = oldPro;
      task.lastProName = oldProName;
      task.proEmail = null;
      task.proName = null;
      task.acceptedAt = null;
      task.deadline = null;
      task.status = "open";
      addTimeline(task, "system", "deadline", `Délai dépassé (${oldProName || "professionnel"}) : la mission est rouverte aux autres professionnels.`);
      changed = true;
      if (oldPro) {
        const prof = await getProfile(oldPro);
        if (prof) {
          prof.content.missedDeadlines = (prof.content.missedDeadlines || 0) + 1;
          await updateFile(profilePath(oldPro), prof.content, prof.sha, `⏰ Délai manqué`);
        }
        await pushNotif(oldPro, { type: "freelance", message: `Délai dépassé pour « ${task.title} » : la mission a été rouverte aux autres professionnels.`, link: `/marketplace/missions/${task.id}` });
      }
      await pushNotif(task.writerEmail, { type: "freelance", message: `Le professionnel n'a pas livré « ${task.title} » dans les délais : la mission est de nouveau ouverte.`, link: `/marketplace/missions/${task.id}` });
    } else if (!task.extensionReminderSent) {
      task.extensionReminderSent = true;
      changed = true;
      await pushNotif(task.writerEmail, { type: "freelance", message: `Une demande de prolongation attend votre décision pour « ${task.title} ».`, link: `/marketplace/missions/${task.id}` });
    }
  }

  // 2. Validation automatique : livré depuis plus de 7 jours sans réponse ni litige
  if (
    task.status === "delivered" &&
    task.deliveredAt &&
    now > new Date(task.deliveredAt).getTime() + 7 * 86400000
  ) {
    const t = await readTask(task.id);
    if (t && t.content.status === "delivered" && !t.content.dispute) {
      t.content._sha = t.sha;
      await doValidate(t.content, { actor: "system", actorName: "validation automatique" });
      addTimeline(t.content, "system", "auto_validate", "Validation automatique après 7 jours sans réponse de l'écrivain.");
      await saveTask(t.content, t.sha, `🤖 Validation auto: ${task.id}`);
      return true;
    }
  }

  if (changed) {
    const t = await readTask(task.id);
    if (t) {
      Object.assign(t.content, {
        status: task.status, proEmail: task.proEmail, proName: task.proName,
        lastProEmail: task.lastProEmail, lastProName: task.lastProName,
        acceptedAt: task.acceptedAt, deadline: task.deadline,
        timeline: task.timeline, extensionReminderSent: task.extensionReminderSent,
      });
      await saveTask(t.content, t.sha, `⏰ Contrôle paresseux: ${task.id}`);
      await upsertIndex(t.content);
    }
  }
  return changed;
}

// ================================================================== GET
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    if (!action) return err(400, "Action manquante.");
    if (!rateLimit(req, `get:${action}`)) return err(429, "Trop de requêtes, réessayez dans une minute.");

    // ---- missions publiques
    if (action === "list_tasks") {
      const category = searchParams.get("category") || "";
      const search = (searchParams.get("search") || "").toLowerCase();
      const status = searchParams.get("status") || "open";
      const limit = Math.min(parseInt(searchParams.get("limit") || "60", 10) || 60, 100);
      const { items } = await readIndex();
      let tasks = items.filter((t) => (status === "all" ? true : t.status === status));
      if (category) tasks = tasks.filter((t) => t.category === category);
      if (search)
        tasks = tasks.filter(
          (t) => (t.title || "").toLowerCase().includes(search) || (t.writerName || "").toLowerCase().includes(search)
        );
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      // Contrôle paresseux des délais sur les missions listées
      for (const t of tasks.slice(0, 20)) {
        const full = await readTask(t.id);
        if (full && full.content.status === "assigned") await applyLazyChecks(full.content);
      }
      return NextResponse.json({ tasks: tasks.slice(0, limit), categories: CATEGORIES, feePercent: FEE, isDemo: isDemo() });
    }

    // ---- détail d'une mission
    if (action === "get_task") {
      const id = searchParams.get("id");
      if (!id) return err(400, "Identifiant de mission manquant.");
      const t = await readTask(id);
      if (!t) return err(404, "Mission introuvable.");
      await applyLazyChecks(t.content);
      const fresh = (await readTask(id)) || t;
      const task = { ...fresh.content };
      delete task._sha;
      const token = searchParams.get("sessionToken");
      const session = token ? await getSessionUser(token).catch(() => null) : null;
      const isParty = session && (session.email === task.writerEmail || session.email === task.proEmail);
      if (!isParty) {
        task.messages = [];
        task.deliverable = null;
        if (task.escrow) task.escrow = { ...task.escrow, captureId: undefined };
      }
      return NextResponse.json({ task, isDemo: isDemo(), feePercent: FEE, categories: CATEGORIES });
    }

    // ---- professionnels publics
    if (action === "list_pros") {
      const dir = await getFile(PROFILES_DIR);
      const pros = [];
      const entries = dir && dir.isDir && Array.isArray(dir.content) ? dir.content : [];
      for (const e of entries.filter((x) => x && x.name && x.name.endsWith(".json")).slice(0, 100)) {
        try {
          const f = await getFile(`${PROFILES_DIR}/${e.name}`);
          if (f && !f.isDir && f.content && f.content.email) {
            const p = { ...f.content };
            delete p.paypalEmail; // jamais exposé publiquement
            pros.push(p);
          }
        } catch {}
      }
      pros.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0) || (b.completedCount || 0) - (a.completedCount || 0));
      return NextResponse.json({ pros, categories: CATEGORIES });
    }

    if (action === "get_pro") {
      const email = searchParams.get("email");
      if (!email || !isEmail(email)) return err(400, "Adresse électronique invalide.");
      const prof = await getProfile(email);
      if (!prof) return err(404, "Profil introuvable.");
      const p = { ...prof.content };
      delete p.paypalEmail; // jamais exposé publiquement
      const { items } = await readIndex();
      const reviews = [];
      for (const e of items.filter((x) => x.proEmail && x.proEmail.toLowerCase() === email.toLowerCase() && x.status === "completed")) {
        const full = await readTask(e.id);
        const r = full && full.content.reviews && full.content.reviews.pro;
        if (r) reviews.push({ taskId: e.id, taskTitle: e.title, ...r });
      }
      reviews.sort((a, b) => new Date(b.at) - new Date(a.at));
      return NextResponse.json({ profile: p, reviews: reviews.slice(0, 50) });
    }

    // ---- tableau de bord (connecté)
    if (action === "dashboard") {
      const session = await requireSession(searchParams.get("sessionToken"));
      const { items } = await readIndex();
      const me = session.email.toLowerCase();
      const writerTasks = items.filter((t) => (t.writerEmail || "").toLowerCase() === me);
      const proTasks = items.filter((t) => (t.proEmail || "").toLowerCase() === me);
      for (const t of [...writerTasks, ...proTasks].slice(0, 30)) {
        const full = await readTask(t.id);
        if (full && (full.content.status === "assigned" || full.content.status === "delivered"))
          await applyLazyChecks(full.content);
      }
      const prof = await getProfile(session.email);
      const { items: payouts } = await readPayouts();
      const mine = payouts.filter((p) => p.proEmail.toLowerCase() === me && p.status === "queued");
      return NextResponse.json({
        user: { email: session.email, name: session.name },
        proProfile: prof ? { ...prof.content, paypalEmail: undefined } : null,
        writerTasks: writerTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        proTasks: proTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        pendingPayouts: { count: mine.length, amount: round2(mine.reduce((s, p) => s + Number(p.amount || 0), 0)) },
        isAdmin: ADMIN_EMAILS.includes(me),
        isDemo: isDemo(),
        feePercent: FEE,
      });
    }

    // ---- administration (lecture)
    if (action === "admin_disputes" || action === "admin_payouts" || action === "admin_ledger") {
      const session = await requireSession(searchParams.get("sessionToken"));
      requireAdmin(session);
      if (action === "admin_disputes") {
        const { items } = await readIndex();
        const disputes = [];
        for (const e of items.filter((t) => t.status === "disputed")) {
          const full = await readTask(e.id);
          if (full) disputes.push({ ...e, dispute: full.content.dispute || null, deadline: full.content.deadline });
        }
        return NextResponse.json({ disputes });
      }
      if (action === "admin_payouts") {
        const { items } = await readPayouts();
        return NextResponse.json({ payouts: [...items].reverse(), isDemo: isDemo() });
      }
      const { content } = await readJsonOr(LEDGER_PATH, []);
      const entries = Array.isArray(content) ? content : [];
      return NextResponse.json({ entries: entries.slice(-200).reverse() });
    }

    return err(400, "Action inconnue.");
  } catch (e) {
    if (e && e.status) return err(e.status, e.message);
    console.error("freelance GET:", e);
    return err(500, "Erreur serveur.");
  }
}

// ================================================================== POST
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, sessionToken, ...data } = body;
    if (!action) return err(400, "Action manquante.");
    if (!rateLimit(req, `post:${action}`)) return err(429, "Trop de requêtes, réessayez dans une minute.");

    // ---------------------------------------------------------- profil pro
    if (action === "create_pro_profile" || action === "update_pro_profile") {
      const session = await requireSession(sessionToken);
      const bio = clean(data.bio, 2000);
      if (bio.length < 30) return err(400, "Présentez-vous en au moins 30 caractères.");
      const specialties = Array.isArray(data.specialties)
        ? data.specialties.filter((s) => CATEGORIES.includes(s))
        : [];
      if (!specialties.length) return err(400, "Choisissez au moins une spécialité.");
      const languages = Array.isArray(data.languages)
        ? data.languages.map((l) => String(l || "").trim()).filter(Boolean).slice(0, 20).join(", ")
        : clean(data.languages, 300);
      const priceHint = clean(data.priceHint, 200);
      const paypalEmail = (data.paypalEmail || "").trim().toLowerCase();
      if (!isEmail(paypalEmail)) return err(400, "Indiquez une adresse PayPal valide : c'est là que vos gains seront versés.");
      const portfolio = Array.isArray(data.portfolio)
        ? data.portfolio.map((u) => (u || "").trim()).filter((u) => u && isUrl(u)).slice(0, 10)
        : [];
      if (data.cguAccepted !== true && action === "create_pro_profile")
        return err(400, "Vous devez accepter les conditions de l'Espace Freelance.");
      const existing = await getProfile(session.email);
      if (action === "create_pro_profile" && existing) return err(400, "Vous avez déjà un profil professionnel.");
      if (action === "update_pro_profile" && !existing) return err(404, "Aucun profil à mettre à jour.");
      const profile = {
        email: session.email,
        name: session.name,
        bio,
        specialties,
        languages,
        priceHint,
        paypalEmail,
        portfolio,
        ratingAvg: existing ? existing.content.ratingAvg || 0 : 0,
        ratingCount: existing ? existing.content.ratingCount || 0 : 0,
        completedCount: existing ? existing.content.completedCount || 0 : 0,
        missedDeadlines: existing ? existing.content.missedDeadlines || 0 : 0,
        verified: existing ? !!existing.content.verified : false,
        createdAt: existing ? existing.content.createdAt : nowIso(),
        updatedAt: nowIso(),
      };
      await updateFile(profilePath(session.email), profile, existing ? existing.sha : null, `👔 Profil pro: ${session.email}`);
      return ok({ profile: { ...profile, paypalEmail: undefined } });
    }

    // ---------------------------------------------------------- créer une mission (brouillon)
    if (action === "create_task") {
      const session = await requireSession(sessionToken);
      const title = clean(data.title, 120);
      if (title.length < 3) return err(400, "Donnez un titre à votre mission (3 caractères minimum).");
      if (!CATEGORIES.includes(data.category)) return err(400, "Catégorie invalide.");
      const description = clean(data.description, 5000);
      if (description.length < 20) return err(400, "Décrivez votre besoin en au moins 20 caractères.");
      const budget = Number(data.budget);
      if (!Number.isFinite(budget) || budget < 10 || budget > 100000)
        return err(400, "Le budget doit être compris entre 10 et 100 000.");
      const wordCount = data.wordCount ? parseInt(data.wordCount, 10) : null;
      if (data.wordCount && (!Number.isFinite(wordCount) || wordCount <= 0))
        return err(400, "Nombre de mots invalide.");
      const briefLink = (data.briefLink || "").trim();
      if (briefLink && !isUrl(briefLink)) return err(400, "Le lien du brief est invalide.");
      let desiredDate = null;
      if (data.desiredDate) {
        const d = new Date(data.desiredDate);
        if (isNaN(d.getTime()) || d.getTime() < Date.now()) return err(400, "La date souhaitée doit être dans le futur.");
        desiredDate = d.toISOString();
      }
      if (data.cguAccepted !== true) return err(400, "Vous devez accepter les conditions de l'Espace Freelance.");
      const task = {
        id: uid("task"),
        title,
        category: data.category,
        description,
        wordCount,
        briefLink: briefLink || null,
        budget: round2(budget),
        currency: CURRENCY,
        writerEmail: session.email,
        writerName: session.name,
        status: "draft",
        createdAt: nowIso(),
        fundedAt: null,
        escrow: null,
        orderId: null,
        proEmail: null,
        proName: null,
        acceptedAt: null,
        deadline: null,
        deliveredAt: null,
        deliverable: null,
        revisionCount: 0,
        extensions: [],
        messages: [],
        timeline: [],
        reviews: {},
        dispute: null,
      };
      addTimeline(task, session.email, "create", "Mission créée (brouillon). En attente du paiement du budget.");
      const r = await updateFile(taskPath(task.id), task, null, `📝 Mission créée: ${task.id}`);
      if (!r.ok) return err(500, "Création impossible pour le moment.");
      const { proAmount, platformFee } = feeSplit(task.budget);
      return ok({ taskId: task.id, budget: task.budget, currency: task.currency, fee: { proAmount, platformFee } });
    }

    // ---------------------------------------------------------- ordre de paiement PayPal
    if (action === "create_paypal_order") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.writerEmail !== session.email) return err(403, "Seul l'auteur de la mission peut la financer.");
      if (task.status !== "draft") return err(400, "Cette mission est déjà financée.");
      let approveUrl, orderId, demo = isDemo();
      if (demo) {
        orderId = `DEMO-ORDER-${task.id}`;
        approveUrl = `/marketplace/retour?taskId=${task.id}&demo=1`;
      } else {
        const returnUrl = `${SITE_URL}/marketplace/retour?taskId=${task.id}`;
        const cancelUrl = `${SITE_URL}/marketplace/missions/${task.id}`;
        try {
          const o = await createOrder(task.budget, returnUrl, cancelUrl, `Mission « ${task.title} » — Lisible`);
          orderId = o.orderId;
          approveUrl = o.approveUrl;
        } catch (e) {
          console.error("createOrder:", e.message);
          return err(502, "PayPal est injoignable pour le moment. Réessayez dans quelques minutes.");
        }
      }
      task.orderId = orderId;
      addTimeline(task, session.email, "order", `Ordre de paiement créé (${demo ? "mode test" : "PayPal"}).`);
      await saveTask(task, t.sha, `💳 Ordre de paiement: ${task.id}`);
      return ok({ approveUrl, orderId, demo });
    }

    // ---------------------------------------------------------- capture (séquestre)
    if (action === "capture_payment") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.writerEmail !== session.email) return err(403, "Seul l'auteur de la mission peut confirmer le paiement.");
      if (task.status === "open" && task.escrow) return ok({ status: "open", already: true });
      if (task.status !== "draft") return err(400, "Cette mission n'est plus payable.");
      const orderId = (data.orderId || "").trim();
      if (!orderId) return err(400, "Référence de commande manquante.");
      let captureId;
      const demo = orderId.startsWith("DEMO-");
      if (demo) {
        captureId = `DEMO-CAP-${Date.now()}`;
      } else {
        try {
          const c = await captureOrder(orderId);
          if (Math.abs(c.amount - task.budget) > 0.01)
            return err(400, "Le montant capturé ne correspond pas au budget de la mission.");
          captureId = c.captureId;
        } catch (e) {
          console.error("captureOrder:", e.message);
          return err(502, "La capture du paiement a échoué. Vérifiez votre compte PayPal et réessayez.");
        }
      }
      task.status = "open";
      task.escrow = { amount: task.budget, status: "held", captureId };
      task.fundedAt = nowIso();
      addTimeline(task, session.email, "fund", `Budget de ${task.budget.toFixed(2)} ${task.currency} capturé et placé sous séquestre${demo ? " (mode test)" : ""}.`);
      await saveTask(task, t.sha, `🔒 Séquestre: ${task.id}`);
      await upsertIndex(task);
      await appendLedger({ type: "escrow_hold", taskId: task.id, actor: session.email, amount: task.budget, currency: task.currency, detail: `Séquestre — capture ${captureId}` });
      await pushNotif(session.email, { type: "freelance", message: `Votre mission « ${task.title} » est publiée : ${task.budget.toFixed(2)} ${task.currency} sont bloqués sous séquestre.`, link: `/marketplace/missions/${task.id}` });
      return ok({ status: "open" });
    }

    // ---------------------------------------------------------- accepter une mission
    if (action === "accept_task") {
      const session = await requireSession(sessionToken);
      const prof = await getProfile(session.email);
      if (!prof) return err(403, "Créez d'abord votre profil professionnel pour accepter une mission.");
      let t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      await applyLazyChecks(t.content);
      t = (await readTask(data.taskId)) || t;
      const task = t.content;
      if (task.status !== "open") return err(409, "Cette mission n'est plus disponible.");
      if (task.writerEmail === session.email) return err(400, "Vous ne pouvez pas accepter votre propre mission.");
      const d = new Date(data.deadline);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const max = new Date();
      max.setDate(max.getDate() + 120);
      if (isNaN(d.getTime()) || d < tomorrow || d > max)
        return err(400, "Délai invalide : choisissez une date entre demain et dans 120 jours.");
      // Relecture avec sha frais juste avant d'écrire (course entre pros)
      const fresh = await readTask(data.taskId);
      if (!fresh || fresh.content.status !== "open")
        return err(409, "Mission déjà prise par un autre professionnel.");
      const fTask = fresh.content;
      fTask.status = "assigned";
      fTask.proEmail = session.email;
      fTask.proName = prof.content.name || session.name;
      fTask.acceptedAt = nowIso();
      fTask.deadline = d.toISOString();
      addTimeline(fTask, session.email, "accept", `${fTask.proName} accepte la mission. Remise prévue le ${d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}.`);
      const r = await saveTask(fTask, fresh.sha, `🤝 Mission acceptée: ${task.id}`);
      if (!r.ok && r.status === 409) return err(409, "Mission déjà prise par un autre professionnel.");
      if (!r.ok) return err(500, "Acceptation impossible pour le moment.");
      await upsertIndex(fTask);
      await pushNotif(task.writerEmail, { type: "freelance", message: `${fTask.proName} a accepté votre mission « ${task.title} ».`, link: `/marketplace/missions/${task.id}` });
      await pushNotif(session.email, { type: "freelance", message: `Vous avez accepté « ${task.title} ». Remise prévue le ${d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}.`, link: `/marketplace/missions/${task.id}` });
      return ok({});
    }

    // ---------------------------------------------------------- livrer
    if (action === "deliver") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.proEmail !== session.email) return err(403, "Seul le professionnel assigné peut livrer.");
      if (task.status !== "assigned") return err(400, "Cette mission n'est pas en cours.");
      const link = (data.deliverableLink || "").trim();
      if (!isHttpsUrl(link)) return err(400, "Indiquez un lien de livrable valide (adresse https).");
      const note = clean(data.note, 1000);
      task.status = "delivered";
      task.deliveredAt = nowIso();
      task.deliverable = { link, note, deliveredAt: nowIso() };
      addTimeline(task, session.email, "deliver", "Travail livré. L'écrivain dispose de 7 jours pour valider ou demander une révision.");
      await saveTask(task, t.sha, `📦 Livraison: ${task.id}`);
      await upsertIndex(task);
      await pushNotif(task.writerEmail, { type: "freelance", message: `Le travail pour « ${task.title} » a été livré. Validez-le ou demandez une révision.`, link: `/marketplace/missions/${task.id}` });
      return ok({});
    }

    // ---------------------------------------------------------- demander une révision
    if (action === "request_revision") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.writerEmail !== session.email) return err(403, "Seul l'écrivain peut demander une révision.");
      if (task.status !== "delivered") return err(400, "Aucune livraison à réviser pour le moment.");
      if ((task.revisionCount || 0) >= 3)
        return err(400, "Limite de 3 révisions atteinte : validez le travail ou ouvrez un litige.");
      const message = clean(data.message, 2000);
      if (message.length < 3) return err(400, "Expliquez ce que vous attendez de cette révision.");
      task.status = "assigned";
      task.revisionCount = (task.revisionCount || 0) + 1;
      if (!Array.isArray(task.messages)) task.messages = [];
      task.messages.push({ id: uid("msg"), at: nowIso(), authorEmail: session.email, authorName: session.name, text: message });
      addTimeline(task, session.email, "revision", `Révision n°${task.revisionCount} demandée.`);
      await saveTask(task, t.sha, `🔁 Révision: ${task.id}`);
      await upsertIndex(task);
      await pushNotif(task.proEmail, { type: "freelance", message: `L'écrivain demande une révision pour « ${task.title} ».`, link: `/marketplace/missions/${task.id}` });
      return ok({ revisionCount: task.revisionCount });
    }

    // ---------------------------------------------------------- valider (libère le séquestre)
    if (action === "validate") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.writerEmail !== session.email) return err(403, "Seul l'écrivain peut valider le travail.");
      if (task.status !== "delivered") return err(400, "Il n'y a pas de livraison à valider.");
      const rating = data.rating ? parseInt(data.rating, 10) : null;
      if (rating && (rating < 1 || rating > 5)) return err(400, "La note doit être entre 1 et 5.");
      task._sha = t.sha;
      const { proAmount, platformFee } = await doValidate(task, {
        actor: session.email,
        actorName: session.name,
        rating,
        comment: clean(data.comment, 1000),
      });
      return ok({ proAmount, platformFee, currency: task.currency });
    }

    // ---------------------------------------------------------- demander une prolongation
    if (action === "request_extension") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.proEmail !== session.email) return err(403, "Seul le professionnel assigné peut demander une prolongation.");
      if (task.status !== "assigned") return err(400, "Cette mission n'est pas en cours.");
      const used = (task.extensions || []).filter((e) => e.status !== "refused").length;
      if (used >= 2) return err(400, "Vous avez déjà utilisé vos 2 prolongations pour cette mission.");
      const days = parseInt(data.days, 10);
      if (!Number.isFinite(days) || days < 1 || days > 7)
        return err(400, "La prolongation doit être de 1 à 7 jours.");
      const reason = clean(data.reason, 500);
      if (reason.length < 3) return err(400, "Expliquez brièvement la raison de cette demande.");
      if (!Array.isArray(task.extensions)) task.extensions = [];
      task.extensions.push({ id: uid("ext"), days, reason, status: "pending", createdAt: nowIso(), decidedAt: null });
      addTimeline(task, session.email, "extension", `Prolongation de ${days} jour(s) demandée.`);
      await saveTask(task, t.sha, `⏳ Prolongation demandée: ${task.id}`);
      await pushNotif(task.writerEmail, { type: "freelance", message: `Le professionnel demande ${days} jour(s) de prolongation pour « ${task.title} ». À vous de trancher.`, link: `/marketplace/missions/${task.id}` });
      return ok({});
    }

    // ---------------------------------------------------------- trancher une prolongation
    if (action === "respond_extension") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.writerEmail !== session.email) return err(403, "Seul l'écrivain peut trancher.");
      const ext = (task.extensions || []).find((e) => e.id === data.extensionId);
      if (!ext || ext.status !== "pending") return err(400, "Demande de prolongation introuvable ou déjà traitée.");
      const approve = data.approve === true;
      ext.status = approve ? "approved" : "refused";
      ext.decidedAt = nowIso();
      if (approve) {
        task.deadline = new Date(new Date(task.deadline).getTime() + ext.days * 86400000).toISOString();
        task.extensionReminderSent = false;
      }
      addTimeline(task, session.email, "extension", `Prolongation ${approve ? "acceptée" : "refusée"} (${ext.days} jour(s)).`);
      await saveTask(task, t.sha, `⚖️ Prolongation tranchée: ${task.id}`);
      await upsertIndex(task);
      await pushNotif(task.proEmail, {
        type: "freelance",
        message: approve
          ? `Prolongation acceptée pour « ${task.title} » : nouvelle échéance le ${new Date(task.deadline).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}.`
          : `Prolongation refusée pour « ${task.title} ».`,
        link: `/marketplace/missions/${task.id}`,
      });
      return ok({ deadline: task.deadline });
    }

    // ---------------------------------------------------------- annuler une mission
    if (action === "cancel_task") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.writerEmail !== session.email) return err(403, "Seul l'écrivain peut annuler sa mission.");
      if (!["draft", "open"].includes(task.status)) return err(400, "Cette mission ne peut plus être annulée.");
      let refunded = false;
      if (task.escrow && task.escrow.status === "held") {
        const demo = (task.escrow.captureId || "").startsWith("DEMO-");
        if (!demo) {
          try {
            await refundCapture(task.escrow.captureId);
          } catch (e) {
            console.error("refundCapture:", e.message);
            return err(502, "Le remboursement a échoué. Réessayez dans quelques minutes.");
          }
        }
        task.escrow.status = "refunded";
        refunded = true;
        await appendLedger({ type: "escrow_refund", taskId: task.id, actor: session.email, amount: task.budget, currency: task.currency, detail: "Annulation — remboursement du séquestre" });
      }
      task.status = "cancelled";
      addTimeline(task, session.email, "cancel", "Mission annulée par l'écrivain.");
      await saveTask(task, t.sha, `🚫 Mission annulée: ${task.id}`);
      await removeFromIndex(task.id);
      await pushNotif(session.email, { type: "freelance", message: `Votre mission « ${task.title} » a été annulée${refunded ? " et remboursée" : ""}.`, link: "/marketplace/tableau-de-bord" });
      return ok({ refunded });
    }

    // ---------------------------------------------------------- litige
    if (action === "open_dispute") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      const isParty = session.email === task.writerEmail || session.email === task.proEmail;
      if (!isParty) return err(403, "Vous n'êtes pas partie à cette mission.");
      if (!["assigned", "delivered"].includes(task.status)) return err(400, "Un litige ne peut être ouvert qu'en cours de mission.");
      const reason = clean(data.reason, 2000);
      if (reason.length < 10) return err(400, "Décrivez le litige en au moins 10 caractères.");
      task.status = "disputed";
      task.dispute = { reason, openedBy: session.email, openedByName: session.name, at: nowIso(), resolved: null };
      addTimeline(task, session.email, "dispute", `Litige ouvert par ${session.name}.`);
      await saveTask(task, t.sha, `⚠️ Litige: ${task.id}`);
      await upsertIndex(task);
      const other = session.email === task.writerEmail ? task.proEmail : task.writerEmail;
      if (other) await pushNotif(other, { type: "freelance", message: `Un litige a été ouvert pour « ${task.title} ». Lisible va trancher.`, link: `/marketplace/missions/${task.id}` });
      for (const admin of ADMIN_EMAILS)
        await pushNotif(admin, { type: "freelance", message: `Nouveau litige sur « ${task.title} » (${task.id}).`, link: "/marketplace/admin" });
      return ok({});
    }

    // ---------------------------------------------------------- trancher un litige (admin)
    if (action === "resolve_dispute") {
      const session = await requireSession(sessionToken);
      requireAdmin(session);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.status !== "disputed") return err(400, "Aucun litige en cours sur cette mission.");
      const decision = data.decision;
      if (!["refund_writer", "pay_pro", "split"].includes(decision)) return err(400, "Décision invalide.");
      const note = clean(data.note, 1000);
      const demo = (task.escrow?.captureId || "").startsWith("DEMO-");

      if (decision === "refund_writer") {
        if (task.escrow && task.escrow.status === "held" && !demo) {
          try {
            await refundCapture(task.escrow.captureId);
          } catch (e) {
            return err(502, "Le remboursement a échoué. Réessayez.");
          }
        }
        if (task.escrow) task.escrow.status = "refunded";
        task.status = "refunded";
        await appendLedger({ type: "dispute_refund", taskId: task.id, actor: session.email, amount: task.budget, currency: task.currency, detail: note || "Litige tranché : remboursement de l'écrivain" });
        addTimeline(task, session.email, "dispute", `Litige tranché : remboursement intégral de l'écrivain (${Number(task.budget).toFixed(2)} ${task.currency}).`);
        await saveTask(task, t.sha, `⚖️ Litige résolu (remboursement): ${task.id}`);
        await upsertIndex(task);
      } else if (decision === "pay_pro") {
        task._sha = t.sha;
        await doValidate(task, { actor: `admin:${session.email}`, actorName: "Lisible (litige)", rating: null, comment: note });
      } else {
        // Partage : le pro reçoit proAmount (net), l'écrivain est remboursé du reste moins la commission
        const proAmount = round2(Number(data.proAmount));
        const platformFee = round2(task.budget * FEE);
        if (!Number.isFinite(proAmount) || proAmount <= 0 || proAmount > round2(task.budget - platformFee))
          return err(400, "Montant du professionnel invalide.");
        const writerRefund = round2(task.budget - proAmount - platformFee);
        if (task.escrow && task.escrow.status === "held" && !demo && writerRefund > 0) {
          try {
            await refundCapture(task.escrow.captureId, writerRefund);
          } catch (e) {
            return err(502, "Le remboursement partiel a échoué. Réessayez.");
          }
        }
        task.escrow.status = "released";
        task.status = "completed";
        task.completedAt = nowIso();
        await appendLedger({ type: "payout_pro", taskId: task.id, actor: task.proEmail, amount: proAmount, currency: task.currency, detail: "Litige tranché : part du professionnel" });
        await appendLedger({ type: "dispute_refund", taskId: task.id, actor: task.writerEmail, amount: writerRefund, currency: task.currency, detail: "Litige tranché : remboursement partiel de l'écrivain" });
        await appendLedger({ type: "platform_fee", taskId: task.id, actor: "platform", amount: platformFee, currency: task.currency, detail: `Commission Lisible (${Math.round(FEE * 100)} %)` });
        const prof = await getProfile(task.proEmail);
        const { items, sha } = await readPayouts();
        items.push({ id: uid("pay"), taskId: task.id, proEmail: task.proEmail, proPaypalEmail: prof ? prof.content.paypalEmail : null, amount: proAmount, currency: task.currency, status: "queued", at: nowIso(), batchId: null, reference: null });
        await savePayouts(items, sha, `💸 Payout (litige): ${task.id}`);
        if (prof) {
          prof.content.completedCount = (prof.content.completedCount || 0) + 1;
          await updateFile(profilePath(task.proEmail), prof.content, prof.sha, `⚖️ Litige résolu: ${task.id}`);
        }
        addTimeline(task, session.email, "dispute", `Litige tranché (partage) : ${proAmount.toFixed(2)} ${task.currency} au professionnel, ${writerRefund.toFixed(2)} ${task.currency} remboursés à l'écrivain.`);
        await saveTask(task, t.sha, `⚖️ Litige résolu (partage): ${task.id}`);
        await upsertIndex(task);
      }

      task.dispute = task.dispute || {};
      task.dispute.resolved = { decision, at: nowIso(), by: session.email, note };
      const t2 = await readTask(task.id);
      if (t2) {
        t2.content.dispute = task.dispute;
        await saveTask(t2.content, t2.sha, `⚖️ Résolution enregistrée: ${task.id}`);
      }
      if (task.writerEmail) await pushNotif(task.writerEmail, { type: "freelance", message: `Le litige sur « ${task.title} » a été tranché par Lisible.`, link: `/marketplace/missions/${task.id}` });
      if (task.proEmail) await pushNotif(task.proEmail, { type: "freelance", message: `Le litige sur « ${task.title} » a été tranché par Lisible.`, link: `/marketplace/missions/${task.id}` });
      return ok({ decision });
    }

    // ---------------------------------------------------------- messages
    if (action === "post_message") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      const isParty = session.email === task.writerEmail || session.email === task.proEmail;
      if (!isParty) return err(403, "Vous n'êtes pas partie à cette mission.");
      const text = clean(data.text, 2000);
      if (text.length < 1) return err(400, "Votre message est vide.");
      if (!Array.isArray(task.messages)) task.messages = [];
      task.messages.push({ id: uid("msg"), at: nowIso(), authorEmail: session.email, authorName: session.name, text });
      await saveTask(task, t.sha, `💬 Message: ${task.id}`);
      const other = session.email === task.writerEmail ? task.proEmail : task.writerEmail;
      if (other) await pushNotif(other, { type: "freelance", message: `Nouveau message de ${session.name} pour « ${task.title} ».`, link: `/marketplace/missions/${task.id}` });
      return ok({});
    }

    // ---------------------------------------------------------- avis
    if (action === "submit_review") {
      const session = await requireSession(sessionToken);
      const t = await readTask(data.taskId);
      if (!t) return err(404, "Mission introuvable.");
      const task = t.content;
      if (task.status !== "completed") return err(400, "Les avis ne sont possibles qu'une fois la mission terminée.");
      const target = data.target === "writer" ? "writer" : "pro";
      const rating = parseInt(data.rating, 10);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) return err(400, "La note doit être entre 1 et 5.");
      const comment = clean(data.comment, 1000);
      if (target === "pro") {
        if (task.writerEmail !== session.email) return err(403, "Seul l'écrivain note le professionnel.");
        if (!task.reviews) task.reviews = {};
        const previous = task.reviews.pro && task.reviews.pro.authorEmail === session.email ? task.reviews.pro : null;
        task.reviews.pro = { rating, comment, at: nowIso(), authorEmail: session.email, authorName: session.name };
        const prof = await getProfile(task.proEmail);
        if (prof) {
          const n = prof.content.ratingCount || 0;
          if (previous && n > 0) {
            // Mise à jour d'une note existante : on remplace l'ancienne valeur
            prof.content.ratingAvg = round2(((prof.content.ratingAvg || 0) * n - previous.rating + rating) / n);
          } else {
            prof.content.ratingAvg = round2(((prof.content.ratingAvg || 0) * n + rating) / (n + 1));
            prof.content.ratingCount = n + 1;
          }
          await updateFile(profilePath(task.proEmail), prof.content, prof.sha, `⭐ Avis: ${task.id}`);
        }
      } else {
        if (task.proEmail !== session.email) return err(403, "Seul le professionnel note l'écrivain.");
        if (!task.reviews) task.reviews = {};
        task.reviews.writer = { rating, comment, at: nowIso(), authorEmail: session.email, authorName: session.name };
      }
      await saveTask(task, t.sha, `⭐ Avis: ${task.id}`);
      return ok({});
    }

    // ---------------------------------------------------------- admin : paiements
    if (action === "admin_run_payouts") {
      const session = await requireSession(sessionToken);
      requireAdmin(session);
      const { items, sha } = await readPayouts();
      const results = [];
      let changed = false;
      for (const p of items.filter((x) => x.status === "queued")) {
        if (isDemo()) {
          p.status = "paid";
          p.batchId = `DEMO-BATCH-${p.id}`;
          p.paidAt = nowIso();
          changed = true;
          results.push({ payoutId: p.id, status: "simulated", batchId: p.batchId, note: "Mode test — aucun argent réel." });
          await appendLedger({ type: "payout_sent", taskId: p.taskId, actor: p.proEmail, amount: p.amount, currency: p.currency, detail: `Simulé (démo) — ${p.batchId}` });
          continue;
        }
        if (!p.proPaypalEmail || !isEmail(p.proPaypalEmail)) {
          results.push({ payoutId: p.id, status: "queued", error: "Adresse PayPal du professionnel manquante ou invalide." });
          continue;
        }
        try {
          const r = await createPayout(p.proPaypalEmail, p.amount, `Mission Lisible — ${p.taskId}`);
          p.status = "paid";
          p.batchId = r.batchId;
          p.paidAt = nowIso();
          changed = true;
          results.push({ payoutId: p.id, status: "paid", batchId: r.batchId });
          await appendLedger({ type: "payout_sent", taskId: p.taskId, actor: p.proEmail, amount: p.amount, currency: p.currency, detail: `PayPal batch ${r.batchId}` });
        } catch (e) {
          if (e instanceof PayoutsDisabledError) {
            results.push({ payoutId: p.id, status: "queued", error: "PAYOUTS_DISABLED : activez les Payouts sur le compte PayPal ou réglez manuellement." });
          } else {
            results.push({ payoutId: p.id, status: "queued", error: e.message || "Échec du versement." });
          }
        }
      }
      if (changed) await savePayouts(items, sha, `💸 Exécution des paiements`);
      return ok({ results });
    }

    if (action === "admin_mark_payout_manual") {
      const session = await requireSession(sessionToken);
      requireAdmin(session);
      const reference = clean(data.reference, 200);
      if (!reference) return err(400, "Indiquez une référence de paiement (ex. numéro de transaction PayPal).");
      const { items, sha } = await readPayouts();
      const p = items.find((x) => x.id === data.payoutId);
      if (!p) return err(404, "Paiement introuvable.");
      p.status = "manual";
      p.reference = reference;
      p.paidAt = nowIso();
      await savePayouts(items, sha, `🤝 Paiement manuel: ${p.id}`);
      await appendLedger({ type: "payout_manual", taskId: p.taskId, actor: p.proEmail, amount: p.amount, currency: p.currency, detail: `Référence : ${reference}` });
      return ok({});
    }

    if (action === "admin_verify_pro") {
      const session = await requireSession(sessionToken);
      requireAdmin(session);
      const email = (data.email || "").trim().toLowerCase();
      if (!isEmail(email)) return err(400, "Adresse électronique invalide.");
      const prof = await getProfile(email);
      if (!prof) return err(404, "Profil introuvable.");
      prof.content.verified = data.verified === true;
      await updateFile(profilePath(email), prof.content, prof.sha, `🛡 Vérification pro: ${email}`);
      await pushNotif(email, { type: "freelance", message: prof.content.verified ? "Votre profil professionnel a été vérifié par Lisible." : "La vérification de votre profil a été retirée.", link: "/marketplace/tableau-de-bord" });
      return ok({ verified: prof.content.verified });
    }

    return err(400, "Action inconnue.");
  } catch (e) {
    if (e && e.status) return err(e.status, e.message);
    console.error("freelance POST:", e);
    return err(500, "Erreur serveur.");
  }
}
