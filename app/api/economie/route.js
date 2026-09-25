import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

// ---------- GET ----------
export async function GET(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN manquant");
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "config";

    if (action === "config") {
      const cfg = await getConfig();
      if (!cfg) return NextResponse.json({ error: "Config introuvable" }, { status: 500 });
      return NextResponse.json({ success: true, config: cfg });
    }

    if (action === "solde") {
      const userEmail = searchParams.get("userEmail");
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
      const userEmail = (searchParams.get("userEmail") || "").toLowerCase().trim();
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
    const body = await req.json();
    const { action, userEmail, adminToken, ...data } = body;
    const cfg = await getConfig();
    if (!cfg) return NextResponse.json({ error: "Config économie introuvable" }, { status: 500 });

    // ===== Envoyer un cadeau =====
    if (action === "envoyer-cadeau") {
      const cadeau = (cfg.cadeaux || []).find((c) => c.id === data.cadeauId);
      if (!cadeau) return NextResponse.json({ error: "Cadeau inconnu" }, { status: 400 });
      const destEmail = (data.destinataireEmail || "").toLowerCase().trim();
      const fromEmail = (userEmail || "").toLowerCase().trim();
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
    if (action === "creer-commande") {
      const pack = (cfg.packs || []).find((p) => p.id === data.packId);
      if (!pack) return NextResponse.json({ error: "Pack inconnu" }, { status: 400 });
      const methode = data.methode;
      const payCfg = (cfg.paiements || {})[methode];
      if (!payCfg) return NextResponse.json({ error: "Moyen de paiement inconnu" }, { status: 400 });
      if (!payCfg.actif)
        return NextResponse.json({ error: `Le paiement par ${payCfg.label} n'est pas encore activé` }, { status: 400 });
      const fromEmail = (userEmail || "").toLowerCase().trim();
      const sender = await getFile(getSafePath(fromEmail));
      if (!sender) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

      const orderId = `cmd_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const order = {
        id: orderId,
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
            `Envoyez ${pack.prixUsd.toFixed(2)} $ US par virement Interac à :`,
            cfg.interacCourriel || "(courriel à configurer)",
            `Référence à indiquer : ${orderId}`,
            "Vos Li seront crédités après validation par notre équipe (sous 24 h).",
          ],
        };
      }
      return NextResponse.json({ success: true, commande: order, instructions });
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
        const uf = await getFile(getSafePath(of.content.userEmail));
        if (!uf) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
        uf.content.li = Number(uf.content.li || 0) + Number(of.content.li);
        uf.content.notifications = [
          {
            id: `achat_${Date.now()}`,
            type: "purchase",
            message: `✅ Achat confirmé : +${of.content.li} Li (${of.content.packNom}). Bonnes lectures !`,
            date: new Date().toISOString(),
            read: false,
          },
          ...(uf.content.notifications || []),
        ].slice(0, 100);
        await updateFile(getSafePath(of.content.userEmail), uf.content, uf.sha, `💰 Li crédités: ${orderId}`);
        of.content.statut = "payee";
        of.content.traiteeLe = new Date().toISOString();
        await updateFile(`data/economie/commandes/${orderId}.json`, of.content, of.sha, `✅ Commande validée ${orderId}`);
        await appendLedger({
          type: "achat",
          de: "plateforme",
          vers: of.content.userEmail,
          versNom: of.content.userNom,
          li: of.content.li,
          usd: of.content.prixUsd,
          methode: of.content.methode,
          commandeId: orderId,
        });
        return NextResponse.json({ success: true });
      }
      of.content.statut = "annulee";
      of.content.traiteeLe = new Date().toISOString();
      await updateFile(`data/economie/commandes/${orderId}.json`, of.content, of.sha, `❌ Commande rejetée ${orderId}`);
      return NextResponse.json({ success: true });
    }

    // ===== Demande de retrait (auteur) =====
    if (action === "demande-retrait") {
      const fromEmail = (userEmail || "").toLowerCase().trim();
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
      const fromEmail = (userEmail || "").toLowerCase().trim();
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
