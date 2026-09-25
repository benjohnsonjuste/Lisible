import { NextResponse } from "next/server";
import {
  paymentsEnabled as paypalEnabled,
  paypalClientIdPublic,
  createSmartOrder,
  captureSmartOrder,
  getSmartOrder,
} from "./paypal.js";
import { getSessionUser } from "../_lib/session.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vérifie le jeton de session client et retourne l'utilisateur connecté,
// ou null si le jeton est absent, invalide ou expiré.
async function requireUser(sessionToken) {
  if (!sessionToken) return null;
  try {
    const s = await getSessionUser(sessionToken);
    return s && s.email ? s : null;
  } catch {
    return null;
  }
}
const SESSION_REQUISE = { error: "Session requise. Reconnectez-vous." };

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN,
};

const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;

// ---------- GitHub helpers ----------
async function getFile(path) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Lisible-App",
        },
        cache: "no-store",
      }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data)) return { content: data, isDir: true };
    if (!data.content) return null;
    const b64 = data.content.replace(/\s/g, "");
    const binString = atob(b64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return { content: JSON.parse(decoded), sha: data.sha };
  } catch (e) {
    console.error(`[economie] getFile ${path}:`, e.message);
    return null;
  }
}

async function updateFile(path, content, sha, message) {
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
  const encoded = btoa(binString);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_CONFIG.token}`,
          "Content-Type": "application/json",
          "User-Agent": "Lisible-App",
        },
        body: JSON.stringify({
          message: `[ECONOMIE] ${message} [skip ci]`,
          content: encoded,
          sha: sha || undefined,
        }),
      }
    );
    return res.ok;
  } catch (e) {
    console.error(`[economie] updateFile ${path}:`, e.message);
    return false;
  }
}

const getSafePath = (email) => {
  if (!email) return null;
  return `data/users/${email.toLowerCase().trim().replace(/[@.]/g, "_")}.json`;
};

async function triggerPusher(channel, event, data) {
  try {
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) return;
    const Pusher = (await import("pusher")).default;
    const pusher = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: "us2",
      useTLS: true,
    });
    await pusher.trigger(channel, event, data);
  } catch (e) {
    console.error("[economie] Pusher:", e.message);
  }
}

async function getConfig() {
  const f = await getFile("data/economie/config.json");
  return f ? f.content : null;
}

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

async function appendLedger(entry) {
  const path = `data/economie/ledger/${monthKey()}.json`;
  const f = await getFile(path);
  const arr = f && Array.isArray(f.content) ? f.content : [];
  arr.push({ id: `tx_${Date.now()}_${Math.floor(Math.random() * 1e6)}`, date: new Date().toISOString(), ...entry });
  // anti-doublon : on garde les 5000 dernières entrées du mois
  const trimmed = arr.slice(-5000);
  await updateFile(path, trimmed, f ? f.sha : null, `Ledger ${monthKey()}`);
}

const isAdmin = (adminToken) =>
  !!process.env.ADMIN_PASSWORD && adminToken === process.env.ADMIN_PASSWORD;

// Secret partagé avec le script de surveillance (cron) — jamais exposé au client.
const isCron = (s) =>
  !!process.env.ECONOMIE_CRON_SECRET && s === process.env.ECONOMIE_CRON_SECRET;

// Crédite les Li d'une commande en attente (idempotent).
// Utilisé par : validation admin, capture PayPal, validation auto Interac.
async function crediterCommande(order, sha) {
  if (!order || order.statut !== "en_attente") return { ok: false, error: "Commande déjà traitée" };
  const uf = await getFile(getSafePath(order.userEmail));
  if (!uf) return { ok: false, error: "Utilisateur introuvable" };
  uf.content.li = Number(uf.content.li || 0) + Number(order.li);
  uf.content.notifications = [
    {
      id: `achat_${Date.now()}`,
      type: "purchase",
      message: `✅ Achat confirmé : +${Number(order.li).toLocaleString("fr-FR")} Li (${order.packNom}). Bonnes lectures !`,
      date: new Date().toISOString(),
      read: false,
    },
    ...(uf.content.notifications || []),
  ].slice(0, 100);
  await updateFile(getSafePath(order.userEmail), uf.content, uf.sha, `💰 Li crédités: ${order.id}`);
  order.statut = "payee";
  order.traiteeLe = new Date().toISOString();
  await updateFile(`data/economie/commandes/${order.id}.json`, order, sha, `✅ Commande validée ${order.id}`);
  await appendLedger({
    type: "achat",
    de: "plateforme",
    vers: order.userEmail,
    versNom: order.userNom,
    li: order.li,
    usd: order.prixUsd,
    methode: order.methode,
    commandeId: order.id,
    paypalCaptureId: order.paypalCaptureId || undefined,
  });
  return { ok: true, nouveauSolde: uf.content.li };
}

// Liste les commandes récentes (pour réconciliation / auto-validation).
async function listerCommandes(limit = 80) {
  const dir = await getFile("data/economie/commandes");
  const files = dir && dir.isDir ? dir.content.filter((x) => x.name.endsWith(".json")) : [];
  const items = [];
  for (const fl of files.slice(-limit)) {
    const f = await getFile(`data/economie/commandes/${fl.name}`);
    if (f) items.push({ ...f.content, _sha: f.sha });
  }
  return items;
}

// ---------- GET ----------
export async function GET(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN manquant");
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "config";

    if (action === "config") {
      const cfg = await getConfig();
      if (!cfg) return NextResponse.json({ error: "Config introuvable" }, { status: 500 });
      const ppActif = paypalEnabled();
      // Les paiements en ligne sont actifs uniquement si les identifiants PayPal sont configurés.
      cfg.paiements = cfg.paiements || {};
      if (cfg.paiements.paypal) cfg.paiements.paypal.actif = ppActif;
      if (cfg.paiements.carte) cfg.paiements.carte.actif = ppActif;
      return NextResponse.json({
        success: true,
        config: cfg,
        paypalActif: ppActif,
        // Identifiant public PayPal (nécessaire au widget de paiement côté client).
        paypalClientId: ppActif ? paypalClientIdPublic() : null,
      });
    }

    if (action === "solde") {
      // L'identité vient de la session serveur vérifiée, jamais du client.
      const session = await requireUser(searchParams.get("sessionToken"));
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const userEmail = session.email;
      const f = await getFile(getSafePath(userEmail));
      if (!f) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      return NextResponse.json({
        success: true,
        solde: {
          li: Number(f.content.li || 0),
          gainsLi: Number(f.content.gainsLi || 0),
          kyc: f.content.kyc || { statut: "non_verifie" },
        },
      });
    }

    if (action === "historique") {
      // L'identité vient de la session serveur vérifiée, jamais du client.
      const session = await requireUser(searchParams.get("sessionToken"));
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const userEmail = (session.email || "").toLowerCase().trim();
      const out = [];
      const now = new Date();
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const f = await getFile(`data/economie/ledger/${monthKey(d)}.json`);
        if (f && Array.isArray(f.content)) {
          for (const e of f.content) {
            if ((e.de || "").toLowerCase() === userEmail || (e.vers || "").toLowerCase() === userEmail)
              out.push(e);
          }
        }
      }
      out.sort((a, b) => new Date(b.date) - new Date(a.date));
      return NextResponse.json({ success: true, historique: out.slice(0, 100) });
    }

    // ----- Admin : listes -----
    if (action === "admin") {
      const adminToken = searchParams.get("adminToken");
      if (!isAdmin(adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const tab = searchParams.get("tab") || "commandes";
      if (tab === "commandes") {
        const dir = await getFile("data/economie/commandes");
        const files = dir && dir.isDir ? dir.content.filter((x) => x.name.endsWith(".json")) : [];
        const items = [];
        for (const fl of files.slice(-60)) {
          const f = await getFile(`data/economie/commandes/${fl.name}`);
          if (f) items.push(f.content);
        }
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        return NextResponse.json({ success: true, items });
      }
      if (tab === "retraits") {
        const dir = await getFile("data/economie/retraits");
        const files = dir && dir.isDir ? dir.content.filter((x) => x.name.endsWith(".json")) : [];
        const items = [];
        for (const fl of files.slice(-60)) {
          const f = await getFile(`data/economie/retraits/${fl.name}`);
          if (f) items.push(f.content);
        }
        items.sort((a, b) => new Date(b.date) - new Date(a.date));
        return NextResponse.json({ success: true, items });
      }
      if (tab === "kyc") {
        const dir = await getFile("data/users");
        const files = dir && dir.isDir ? dir.content.filter((x) => x.name.endsWith(".json")) : [];
        const items = [];
        for (const fl of files) {
          const f = await getFile(`data/users/${fl.name}`);
          const kyc = f && f.content.kyc;
          if (kyc && (kyc.statut === "en_attente" || kyc.statut === "verifie"))
            items.push({ email: f.content.email, name: f.content.name, kyc });
          if (items.length >= 60) break;
        }
        return NextResponse.json({ success: true, items });
      }
      return NextResponse.json({ error: "Onglet inconnu" }, { status: 400 });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("[economie] GET:", e.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ---------- POST ----------
export async function POST(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN manquant");
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }
    const { action, userEmail, adminToken, ...data } = body;
    const cfg = await getConfig();
    if (!cfg) return NextResponse.json({ error: "Config économie introuvable" }, { status: 500 });

    // ===== Envoyer un cadeau =====
    if (action === "envoyer-cadeau") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const fromEmail = (session.email || "").toLowerCase().trim();
      const cadeau = (cfg.cadeaux || []).find((c) => c.id === data.cadeauId);
      if (!cadeau) return NextResponse.json({ error: "Cadeau inconnu" }, { status: 400 });
      const destEmail = (data.destinataireEmail || "").toLowerCase().trim();
      if (!destEmail || !fromEmail) return NextResponse.json({ error: "Emails manquants" }, { status: 400 });
      if (destEmail === fromEmail) return NextResponse.json({ error: "Vous ne pouvez pas vous offrir un cadeau à vous-même" }, { status: 400 });

      const sender = await getFile(getSafePath(fromEmail));
      const dest = await getFile(getSafePath(destEmail));
      if (!sender || !dest) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      const prix = Number(cadeau.li);
      const soldeSender = Number(sender.content.li || 0);
      if (soldeSender < prix)
        return NextResponse.json({ error: "Solde Li insuffisant", solde: soldeSender }, { status: 400 });

      const partAuteur = Math.floor((prix * cfg.partAuteurPct) / 100);
      const partPlateforme = prix - partAuteur;

      sender.content.li = soldeSender - prix;
      dest.content.gainsLi = Number(dest.content.gainsLi || 0) + partAuteur;
      const notif = {
        id: `gift_${Date.now()}`,
        type: "gift",
        message: `🎁 ${sender.content.name} vous a offert ${cadeau.icone} ${cadeau.nom} (+${partAuteur} Li de gains) !`,
        date: new Date().toISOString(),
        read: false,
      };
      dest.content.notifications = [notif, ...(dest.content.notifications || [])].slice(0, 100);

      await updateFile(getSafePath(fromEmail), sender.content, sender.sha, `🎁 Cadeau envoyé: ${cadeau.id}`);
      await updateFile(getSafePath(destEmail), dest.content, dest.sha, `🎁 Cadeau reçu: ${cadeau.id}`);

      await appendLedger({
        type: "cadeau",
        de: fromEmail,
        deNom: sender.content.name,
        vers: destEmail,
        versNom: dest.content.name,
        li: prix,
        usd: +(prix * cfg.tauxUsdParLi).toFixed(2),
        partAuteurLi: partAuteur,
        partPlateformeLi: partPlateforme,
        cadeauId: cadeau.id,
        cadeauNom: cadeau.nom,
        contexte: data.contexte || null,
      });

      const event = {
        cadeauId: cadeau.id,
        cadeauNom: cadeau.nom,
        icone: cadeau.icone,
        animation: cadeau.animation,
        li: prix,
        usd: +(prix * cfg.tauxUsdParLi).toFixed(2),
        de: fromEmail,
        deNom: sender.content.name,
        versNom: dest.content.name,
        pauseChat: cadeau.id === "grimoire_or",
        contexte: data.contexte || null,
      };

      // Temps réel : tous les spectateurs du live voient l'animation
      if (data.contexte && data.contexte.type === "live" && data.contexte.refId) {
        await triggerPusher(`live-room-${data.contexte.refId}`, "gift", event);
      }

      return NextResponse.json({ success: true, event, nouveauSolde: sender.content.li });
    }

    // ===== Créer une commande d'achat de Li =====
    // Interac : crée une commande en attente (validation automatique par courriel).
    // PayPal / carte : passer par paypal-creer-ordre (boutons intelligents, 100 % automatique).
    if (action === "creer-commande") {
      const pack = (cfg.packs || []).find((p) => p.id === data.packId);
      if (!pack) return NextResponse.json({ error: "Pack inconnu" }, { status: 400 });
      const methode = data.methode;
      if (methode === "paypal" || methode === "carte")
        return NextResponse.json({ error: "Utilisez le paiement PayPal / carte automatique", usePaypalSmart: true }, { status: 400 });
      const payCfg = (cfg.paiements || {})[methode];
      if (!payCfg) return NextResponse.json({ error: "Moyen de paiement inconnu" }, { status: 400 });
      if (!payCfg.actif)
        return NextResponse.json({ error: `Le paiement par ${payCfg.label} n'est pas encore activé` }, { status: 400 });
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const fromEmail = (session.email || "").toLowerCase().trim();
      const sender = await getFile(getSafePath(fromEmail));
      if (!sender) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      const orderId = `cmd_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const reference = `LI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const order = {
        id: orderId,
        reference,
        userEmail: fromEmail,
        userNom: sender.content.name,
        packId: pack.id,
        packNom: pack.nom,
        li: pack.li,
        prixUsd: pack.prixUsd,
        methode,
        statut: "en_attente",
        date: new Date().toISOString(),
      };
      await updateFile(`data/economie/commandes/${orderId}.json`, order, null, `🧾 Commande ${orderId}`);

      let instructions = null;
      if (methode === "interac") {
        instructions = {
          titre: "Virement Interac",
          lignes: [
            `Envoyez ${pack.prixUsd.toFixed(2)} $ US (ou l'équivalent en $ CA) par virement Interac à :`,
            cfg.interacCourriel || "(courriel à configurer)",
            `Référence OBLIGATOIRE à indiquer dans le message : ${reference}`,
            "Vos Li seront crédités automatiquement dès réception du virement.",
          ],
          reference,
        };
      }
      return NextResponse.json({ success: true, commande: order, instructions });
    }

    // ===== PayPal : créer une commande (boutons intelligents) =====
    if (action === "paypal-creer-ordre") {
      if (!paypalEnabled())
        return NextResponse.json({ error: "Le paiement en ligne sera activé très bientôt." }, { status: 400 });
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const fromEmail = (session.email || "").toLowerCase().trim();
      const pack = (cfg.packs || []).find((p) => p.id === data.packId);
      if (!pack) return NextResponse.json({ error: "Pack inconnu" }, { status: 400 });
      const sender = await getFile(getSafePath(fromEmail));
      if (!sender) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      const orderId = `cmd_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      let pp;
      try {
        pp = await createSmartOrder(pack.prixUsd, `${pack.nom} — ${pack.li} Li (Lisible)`, orderId);
      } catch (e) {
        console.error("[economie] PayPal create:", e.message);
        return NextResponse.json({ error: "Paiement indisponible pour le moment, réessayez." }, { status: 502 });
      }
      const order = {
        id: orderId,
        paypalOrderId: pp.orderId,
        userEmail: fromEmail,
        userNom: sender.content.name,
        packId: pack.id,
        packNom: pack.nom,
        li: pack.li,
        prixUsd: pack.prixUsd,
        methode: "paypal",
        statut: "en_attente",
        date: new Date().toISOString(),
      };
      await updateFile(`data/economie/commandes/${orderId}.json`, order, null, `🧾 Commande PayPal ${orderId}`);
      return NextResponse.json({ success: true, paypalOrderId: pp.orderId, commandeId: orderId });
    }

    // ===== PayPal : capturer après approbation (crédit automatique) =====
    if (action === "paypal-capturer") {
      if (!paypalEnabled()) return NextResponse.json({ error: "Paiement en ligne indisponible" }, { status: 400 });
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const paypalOrderId = data.paypalOrderId;
      if (!paypalOrderId) return NextResponse.json({ error: "Commande PayPal manquante" }, { status: 400 });
      const commandes = await listerCommandes(120);
      const found = commandes.find((o) => o.paypalOrderId === paypalOrderId);
      if (!found) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      // La commande ne peut être capturée que par son propre acheteur.
      if ((found.userEmail || "").toLowerCase() !== (session.email || "").toLowerCase())
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      if (found.statut !== "en_attente") {
        const uf = await getFile(getSafePath(found.userEmail));
        return NextResponse.json({ success: true, dejaTraitee: true, nouveauSolde: uf ? Number(uf.content.li || 0) : 0 });
      }
      let capture;
      try {
        capture = await captureSmartOrder(paypalOrderId);
      } catch (e) {
        console.error("[economie] PayPal capture:", e.message);
        return NextResponse.json({ error: "La capture du paiement a échoué. Vous n'avez pas été débité." }, { status: 502 });
      }
      // Vérifications anti-fraude : statut, devise, montant exact du pack.
      if (capture.status !== "COMPLETED" || capture.currency !== "USD" || Math.abs(capture.amount - Number(found.prixUsd)) > 0.01) {
        console.error("[economie] Capture suspecte:", JSON.stringify({ capture, attendu: found.prixUsd }));
        return NextResponse.json({ error: "Paiement non conforme, contactez le support." }, { status: 400 });
      }
      found.paypalCaptureId = capture.captureId;
      const res = await crediterCommande(found, found._sha);
      if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, nouveauSolde: res.nouveauSolde, li: found.li });
    }

    // ===== Cron : réconcilier les commandes PayPal approuvées mais non capturées =====
    if (action === "paypal-reconcilier") {
      if (!isCron(data.cronSecret)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      if (!paypalEnabled()) return NextResponse.json({ success: true, reconcilees: 0, note: "PayPal non configuré" });
      const commandes = await listerCommandes(120);
      const enAttente = commandes.filter((o) => o.statut === "en_attente" && o.paypalOrderId);
      const resultat = { verifiees: 0, creditees: 0, expirees: 0 };
      for (const o of enAttente) {
        try {
          const info = await getSmartOrder(o.paypalOrderId);
          resultat.verifiees++;
          if (info.status === "APPROVED") {
            const capture = await captureSmartOrder(o.paypalOrderId);
            if (capture.status === "COMPLETED" && capture.currency === "USD" && Math.abs(capture.amount - Number(o.prixUsd)) <= 0.01) {
              o.paypalCaptureId = capture.captureId;
              const r = await crediterCommande(o, o._sha);
              if (r.ok) resultat.creditees++;
            }
          } else if (info.status === "COMPLETED") {
            // Déjà capturée côté PayPal mais non créditée ici : on crédite après vérification.
            if (info.currency === "USD" && Math.abs(info.amount - Number(o.prixUsd)) <= 0.01) {
              const r = await crediterCommande(o, o._sha);
              if (r.ok) resultat.creditees++;
            }
          } else if (info.status === "VOIDED" || Date.now() - new Date(o.date).getTime() > 72 * 3600 * 1000) {
            o.statut = "expiree";
            o.traiteeLe = new Date().toISOString();
            await updateFile(`data/economie/commandes/${o.id}.json`, o, o._sha, `⌛ Commande expirée ${o.id}`);
            resultat.expirees++;
          }
        } catch (e) {
          console.error("[economie] Réconciliation", o.id, e.message);
        }
      }
      return NextResponse.json({ success: true, ...resultat });
    }

    // ===== Cron : validation automatique des virements Interac =====
    // Reçoit la liste des notifications de virement détectées dans la boîte
    // courriel et crédite les commandes correspondantes (référence + montant).
    if (action === "interac-auto-valider") {
      if (!isCron(data.cronSecret)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const virements = Array.isArray(data.virements) ? data.virements : [];
      const traitesPath = "data/economie/interac-traites.json";
      const tf = await getFile(traitesPath);
      const traites = tf && Array.isArray(tf.content) ? tf.content : [];
      const traitesSet = new Set(traites);
      const commandes = await listerCommandes(150);
      const enAttente = commandes.filter((o) => o.statut === "en_attente" && o.methode === "interac");
      const resultat = { examines: virements.length, valides: [], dejaTraites: 0 };
      for (const v of virements) {
        const vid = String(v.id || `${v.date}_${v.montant}`);
        if (traitesSet.has(vid)) { resultat.dejaTraites++; continue; }
        const message = String(v.message || "").toUpperCase();
        const montant = Number(v.montant || 0);
        const match = enAttente.find((o) => {
          const refOk = (o.reference && message.includes(String(o.reference).toUpperCase())) || message.includes(o.id.toUpperCase());
          if (!refOk) return false;
          const tolerance = Math.max(1, Number(o.prixUsd) * 0.08);
          return Math.abs(montant - Number(o.prixUsd)) <= tolerance;
        });
        if (match) {
          const r = await crediterCommande(match, match._sha);
          if (r.ok) {
            resultat.valides.push({ commande: match.id, reference: match.reference, li: match.li });
            enAttente.splice(enAttente.indexOf(match), 1);
          }
        }
        traites.push(vid);
        traitesSet.add(vid);
      }
      if (virements.length) {
        await updateFile(traitesPath, traites.slice(-2000), tf ? tf.sha : null, "📥 Notifications Interac traitées");
      }
      return NextResponse.json({ success: true, ...resultat });
    }

    // ===== Admin : valider / rejeter une commande =====
    if (action === "valider-commande" || action === "rejeter-commande") {
      if (!isAdmin(adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const orderId = data.orderId;
      const of = await getFile(`data/economie/commandes/${orderId}.json`);
      if (!of) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      if (of.content.statut !== "en_attente")
        return NextResponse.json({ error: "Commande déjà traitée" }, { status: 400 });

      if (action === "valider-commande") {
        const r = await crediterCommande(of.content, of.sha);
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
        return NextResponse.json({ success: true, nouveauSolde: r.nouveauSolde });
      }
      of.content.statut = "annulee";
      of.content.traiteeLe = new Date().toISOString();
      await updateFile(`data/economie/commandes/${orderId}.json`, of.content, of.sha, `❌ Commande rejetée ${orderId}`);
      return NextResponse.json({ success: true });
    }

    // ===== Demande de retrait (auteur) =====
    if (action === "demande-retrait") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const fromEmail = (session.email || "").toLowerCase().trim();
      const uf = await getFile(getSafePath(fromEmail));
      if (!uf) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      const kyc = uf.content.kyc || { statut: "non_verifie" };
      if (cfg.kycRequis && kyc.statut !== "verifie")
        return NextResponse.json({ error: "Vérification d'identité requise avant tout retrait", kycStatut: kyc.statut }, { status: 403 });
      const montant = Math.floor(Number(data.montantLi) || 0);
      const gains = Number(uf.content.gainsLi || 0);
      if (montant < cfg.seuilRetraitLi)
        return NextResponse.json({ error: `Montant minimum : ${cfg.seuilRetraitLi.toLocaleString("fr-FR")} Li` }, { status: 400 });
      if (montant > gains) return NextResponse.json({ error: "Gains insuffisants", gains }, { status: 400 });

      const reserve = Math.floor((montant * cfg.reserveChargebackPct) / 100);
      const net = montant - reserve;
      const retraitId = `ret_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const retrait = {
        id: retraitId,
        userEmail: fromEmail,
        userNom: uf.content.name,
        montantLi: montant,
        reserveLi: reserve,
        netLi: net,
        brutUsd: +(montant * cfg.tauxUsdParLi).toFixed(2),
        netUsd: +(net * cfg.tauxUsdParLi).toFixed(2),
        note: "Frais bancaires déduits du montant versé au moment du paiement.",
        moyen: data.moyen || "paypal",
        coordonnees: data.coordonnees || "",
        statut: "en_attente",
        date: new Date().toISOString(),
      };
      uf.content.gainsLi = gains - montant;
      uf.content.notifications = [
        {
          id: `retrait_${Date.now()}`,
          type: "withdrawal",
          message: `📤 Demande de retrait de ${montant.toLocaleString("fr-FR")} Li envoyée. Réserve de ${cfg.reserveChargebackPct} % appliquée.`,
          date: new Date().toISOString(),
          read: false,
        },
        ...(uf.content.notifications || []),
      ].slice(0, 100);
      await updateFile(getSafePath(fromEmail), uf.content, uf.sha, `📤 Retrait demandé: ${retraitId}`);
      await updateFile(`data/economie/retraits/${retraitId}.json`, retrait, null, `📤 Retrait ${retraitId}`);
      await appendLedger({ type: "retrait_demande", de: fromEmail, deNom: uf.content.name, vers: "plateforme", li: montant, usd: retrait.brutUsd, retraitId });
      return NextResponse.json({ success: true, retrait });
    }

    // ===== KYC : soumission =====
    if (action === "kyc-soumettre") {
      const session = await requireUser(body.sessionToken);
      if (!session) return NextResponse.json(SESSION_REQUISE, { status: 401 });
      const fromEmail = (session.email || "").toLowerCase().trim();
      const uf = await getFile(getSafePath(fromEmail));
      if (!uf) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      uf.content.kyc = {
        statut: "en_attente",
        nom: data.nom || "",
        prenom: data.prenom || "",
        dateNaissance: data.dateNaissance || "",
        pays: data.pays || "",
        pieceType: data.pieceType || "",
        pieceNumero: data.pieceNumero || "",
        moyenPaiement: data.moyenPaiement || "paypal",
        coordonnees: data.coordonnees || "",
        soumisLe: new Date().toISOString(),
      };
      await updateFile(getSafePath(fromEmail), uf.content, uf.sha, `🪪 KYC soumis`);
      return NextResponse.json({ success: true });
    }

    // ===== Admin : KYC =====
    if (action === "admin-kyc") {
      if (!isAdmin(adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const uf = await getFile(getSafePath(data.targetEmail));
      if (!uf) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      uf.content.kyc = { ...(uf.content.kyc || {}), statut: data.decision === "verifier" ? "verifie" : "refuse", traiteLe: new Date().toISOString() };
      uf.content.notifications = [
        {
          id: `kyc_${Date.now()}`,
          type: "kyc",
          message: data.decision === "verifier" ? "🪪 Votre identité est vérifiée. Vous pouvez demander des retraits." : "🪪 Votre vérification d'identité a été refusée. Vérifiez vos informations.",
          date: new Date().toISOString(),
          read: false,
        },
        ...(uf.content.notifications || []),
      ].slice(0, 100);
      await updateFile(getSafePath(data.targetEmail), uf.content, uf.sha, `🪪 KYC ${data.decision}`);
      return NextResponse.json({ success: true });
    }

    // ===== Admin : traiter un retrait =====
    if (action === "admin-retrait") {
      if (!isAdmin(adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const rf = await getFile(`data/economie/retraits/${data.retraitId}.json`);
      if (!rf) return NextResponse.json({ error: "Retrait introuvable" }, { status: 404 });
      if (rf.content.statut !== "en_attente")
        return NextResponse.json({ error: "Retrait déjà traité" }, { status: 400 });
      rf.content.statut = data.decision === "payer" ? "paye" : "refuse";
      rf.content.reference = data.reference || "";
      rf.content.traiteLe = new Date().toISOString();
      await updateFile(`data/economie/retraits/${data.retraitId}.json`, rf.content, rf.sha, `💸 Retrait ${data.decision}`);
      if (data.decision === "payer") {
        await appendLedger({ type: "retrait_paye", de: "plateforme", vers: rf.content.userEmail, versNom: rf.content.userNom, li: rf.content.netLi, usd: rf.content.netUsd, retraitId: rf.content.id, reference: rf.content.reference });
      } else {
        // remboursement des gains en cas de refus
        const uf = await getFile(getSafePath(rf.content.userEmail));
        if (uf) {
          uf.content.gainsLi = Number(uf.content.gainsLi || 0) + Number(rf.content.montantLi);
          await updateFile(getSafePath(rf.content.userEmail), uf.content, uf.sha, `↩️ Retrait refusé, gains restaurés`);
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("[economie] POST:", e.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
