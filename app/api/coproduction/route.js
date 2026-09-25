import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Module Coproduction participative & partage de revenus — Lisible.biz
//
// Principes (conformes au cahier des charges) :
// - AUCUN rendement garanti, AUCUN taux d'intérêt : seul le chiffre d'affaires
//   réellement encaissé est partagé. Si le livre ne vend rien, rien n'est versé.
// - Répartition des recettes encaissées : 60 % coproducteurs (prorata, plafond
//   110-120 % de la mise), 20 % auteur, 20 % plateforme.
// - Fenêtre de 12 mois max à compter de la sortie officielle.
// - Redistribution uniquement après encaissement définitif (anti-chargeback).
// - Campagne échouée (< 100 % de l'objectif) : remboursement AUTOMATIQUE en Li
//   (Solde Lisible), hors frais de dépôt non remboursables (2,5 %).
// ---------------------------------------------------------------------------

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN,
};

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
    return { content: JSON.parse(new TextDecoder().decode(bytes)), sha: data.sha };
  } catch (e) {
    console.error(`[coproduction] getFile ${path}:`, e.message);
    return null;
  }
}

async function updateFile(path, content, sha, message) {
  const jsonString = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(jsonString);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
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
          message: `[COPRODUCTION] ${message} [skip ci]`,
          content: btoa(binString),
          sha: sha || undefined,
        }),
      }
    );
    return res.ok;
  } catch (e) {
    console.error(`[coproduction] updateFile ${path}:`, e.message);
    return false;
  }
}

const getSafePath = (email) =>
  email ? `data/users/${email.toLowerCase().trim().replace(/[@.]/g, "_")}.json` : null;

const isAdmin = (t) => !!process.env.ADMIN_PASSWORD && t === process.env.ADMIN_PASSWORD;
const isCron = (s) => !!process.env.ECONOMIE_CRON_SECRET && s === process.env.ECONOMIE_CRON_SECRET;

const arr2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const cadToLi = (cad, taux) => Math.round(Number(cad || 0) * Number(taux || 0.73) * 100);
const uid = (p) => `${p}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

async function getConfig() {
  const f = await getFile("data/coproduction/config.json");
  return f ? f.content : null;
}
async function getCampagnes() {
  const f = await getFile("data/coproduction/campagnes.json");
  return { list: f && Array.isArray(f.content) ? f.content : [], sha: f ? f.sha : null };
}
async function saveCampagnes(list, sha, msg) {
  return updateFile("data/coproduction/campagnes.json", list, sha, msg);
}

// Enregistre l'activité d'un utilisateur (utilisé pour la clause de solde inactif).
async function toucherActivite(email) {
  try {
    const p = getSafePath(email);
    if (!p) return;
    const uf = await getFile(p);
    if (!uf) return;
    uf.content.derniereActivite = new Date().toISOString();
    await updateFile(p, uf.content, uf.sha, `Activité ${email}`);
  } catch (e) {
    console.error("[coproduction] toucherActivite:", e.message);
  }
}

async function notifier(email, type, message, link) {
  try {
    const p = getSafePath(email);
    if (!p) return;
    const uf = await getFile(p);
    if (!uf) return;
    uf.content.notifications = [
      { id: uid("copro"), type, message, link: link || "/coproduction", date: new Date().toISOString(), read: false },
      ...(uf.content.notifications || []),
    ].slice(0, 100);
    await updateFile(p, uf.content, uf.sha, `Notification ${email}`);
  } catch (e) {
    console.error("[coproduction] notifier:", e.message);
  }
}

// Crédite des Li (montant en CAD converti au taux du jour). Retourne les Li crédités.
async function crediterLiCAD(email, montantCAD, taux, message, type = "coproduction") {
  const li = cadToLi(montantCAD, taux);
  if (li <= 0) return 0;
  const p = getSafePath(email);
  const uf = await getFile(p);
  if (!uf) return 0;
  uf.content.li = Number(uf.content.li || 0) + li;
  uf.content.derniereActivite = new Date().toISOString();
  uf.content.notifications = [
    { id: uid("copro"), type, message, link: "/coproduction", date: new Date().toISOString(), read: false },
    ...(uf.content.notifications || []),
  ].slice(0, 100);
  await updateFile(p, uf.content, uf.sha, `Crédit ${li} Li → ${email}`);
  return li;
}

async function debiterLi(email, li, message) {
  const p = getSafePath(email);
  const uf = await getFile(p);
  if (!uf) return { ok: false, error: "Utilisateur introuvable" };
  if (Number(uf.content.li || 0) < li) return { ok: false, error: "Solde Li insuffisant" };
  uf.content.li = Number(uf.content.li || 0) - li;
  uf.content.derniereActivite = new Date().toISOString();
  uf.content.notifications = [
    { id: uid("copro"), type: "coproduction", message, link: "/coproduction", date: new Date().toISOString(), read: false },
    ...(uf.content.notifications || []),
  ].slice(0, 100);
  await updateFile(p, uf.content, uf.sha, `Débit ${li} Li ← ${email}`);
  return { ok: true, nouveauSolde: uf.content.li };
}

const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
async function appendLedger(entry) {
  const path = `data/coproduction/ledger/${monthKey()}.json`;
  const f = await getFile(path);
  const arr = f && Array.isArray(f.content) ? f.content : [];
  arr.push({ id: uid("tx"), date: new Date().toISOString(), ...entry });
  await updateFile(path, arr.slice(-5000), f ? f.sha : null, `Ledger coproduction ${monthKey()}`);
}

// Vue publique d'une campagne (sans les emails des contributeurs).
function campagnePublique(c) {
  const { contributions, ...rest } = c;
  return {
    ...rest,
    nbContributeurs: (contributions || []).filter((x) => x.statut === "active").length,
    pourcentage: c.objectifCAD > 0 ? Math.round((Number(c.montantCollecteCAD || 0) / c.objectifCAD) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
export async function GET(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN manquant");
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "config";
    const cfg = await getConfig();
    if (!cfg) return NextResponse.json({ error: "Config introuvable" }, { status: 500 });

    if (action === "config") {
      return NextResponse.json({
        success: true,
        config: {
          fraisDepotPct: cfg.fraisDepotPct,
          plafondRemboursementPct: cfg.plafondRemboursementPct,
          dureeMaxMois: cfg.dureeMaxMois,
          delaiEncaissementJours: cfg.delaiEncaissementJours,
          partCoproducteursPct: cfg.partCoproducteursPct,
          partAuteurPct: cfg.partAuteurPct,
          partPlateformePct: cfg.partPlateformePct,
          contributionMinCAD: cfg.contributionMinCAD,
          contributionMaxCAD: cfg.contributionMaxCAD,
          dureeCampagneJours: cfg.dureeCampagneJours,
          pool: { nom: cfg.pool.nom, prixPartCAD: cfg.pool.prixPartCAD, fraisGestionPct: cfg.pool.fraisGestionPct },
          inactivite: cfg.inactivite,
        },
      });
    }

    if (action === "campagnes") {
      const { list } = await getCampagnes();
      return NextResponse.json({ success: true, campagnes: list.map(campagnePublique) });
    }

    if (action === "campagne") {
      const id = searchParams.get("id");
      const { list } = await getCampagnes();
      const c = list.find((x) => x.id === id);
      if (!c) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
      return NextResponse.json({ success: true, campagne: campagnePublique(c) });
    }

    if (action === "mes-contributions") {
      const userEmail = (searchParams.get("userEmail") || "").toLowerCase().trim();
      const { list } = await getCampagnes();
      const out = [];
      for (const c of list) {
        for (const co of c.contributions || []) {
          if ((co.userEmail || "").toLowerCase() === userEmail && !co.estPool) {
            out.push({
              campagneId: c.id, titre: c.titre, statutCampagne: c.statut,
              montantCAD: co.montantCAD, montantNetCAD: co.montantNetCAD,
              recuCAD: arr2(co.recuCAD || 0), statut: co.statut, date: co.date,
            });
          }
        }
      }
      return NextResponse.json({ success: true, contributions: out });
    }

    if (action === "pool") {
      const pf = await getFile("data/coproduction/pool.json");
      const pool = pf ? pf.content : { parts: [], deploiements: [], distributions: [] };
      const userEmail = (searchParams.get("userEmail") || "").toLowerCase().trim();
      const mesParts = pool.parts.filter((p) => (p.userEmail || "").toLowerCase() === userEmail);
      const totalParts = pool.parts.reduce((s, p) => s + Number(p.nbParts || 0), 0);
      return NextResponse.json({
        success: true,
        pool: {
          nom: cfg.pool.nom,
          prixPartCAD: cfg.pool.prixPartCAD,
          fraisGestionPct: cfg.pool.fraisGestionPct,
          totalParts,
          capitalCAD: arr2(totalParts * cfg.pool.prixPartCAD),
          nbInvestisseurs: new Set(pool.parts.map((p) => (p.userEmail || "").toLowerCase())).size,
          deploiements: pool.deploiements.map((d) => ({
            trimestre: d.trimestre, campagneId: d.campagneId, titre: d.titre,
            montantCAD: d.montantCAD, recuCAD: arr2(d.recuCAD || 0), date: d.date,
          })),
          distributions: (pool.distributions || []).slice(-8).map((d) => ({
            trimestre: d.trimestre, totalCAD: d.totalCAD, fraisGestionCAD: d.fraisGestionCAD,
            netCAD: d.netCAD, date: d.date, nbBeneficiaires: d.nbBeneficiaires,
          })),
        },
        mesParts,
      });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("[coproduction] GET:", e.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
export async function POST(req) {
  try {
    if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN manquant");
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const cfg = await getConfig();
    if (!cfg) return NextResponse.json({ error: "Config introuvable" }, { status: 500 });

    // --- Ping d'activité (limité côté client à 1/jour) ---
    if (action === "toucher-activite") {
      const email = (body.userEmail || "").toLowerCase().trim();
      if (email) await toucherActivite(email);
      return NextResponse.json({ success: true });
    }

    // --- Création d'une campagne (admin) ---
    if (action === "creer-campagne") {
      if (!isAdmin(body.adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const { list, sha } = await getCampagnes();
      const c = {
        id: uid("camp"),
        titre: String(body.titre || "").slice(0, 120),
        auteurEmail: (body.auteurEmail || "").toLowerCase().trim(),
        description: String(body.description || "").slice(0, 2000),
        budget: {
          correction: arr2(body.budget?.correction),
          couverture: arr2(body.budget?.couverture),
          marketing: arr2(body.budget?.marketing),
        },
        objectifCAD: arr2(body.objectifCAD),
        montantCollecteCAD: 0,
        fraisDepotPct: cfg.fraisDepotPct,
        plafondPct: Math.min(120, Math.max(110, Number(body.plafondPct) || cfg.plafondRemboursementPct)),
        statut: "brouillon",
        dateCreation: new Date().toISOString(),
        dateDebut: null,
        dateFin: null,
        dateSortie: null,
        contributions: [],
      };
      if (!c.titre || !c.auteurEmail || !(c.objectifCAD > 0)) {
        return NextResponse.json({ error: "Titre, auteur et objectif requis" }, { status: 400 });
      }
      list.push(c);
      await saveCampagnes(list, sha, `Nouvelle campagne ${c.id}`);
      return NextResponse.json({ success: true, campagne: campagnePublique(c) });
    }

    // --- Publication d'une campagne (admin) : démarre la collecte ---
    if (action === "publier-campagne") {
      if (!isAdmin(body.adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const { list, sha } = await getCampagnes();
      const c = list.find((x) => x.id === body.campagneId);
      if (!c) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
      if (c.statut !== "brouillon") return NextResponse.json({ error: "Déjà publiée" }, { status: 400 });
      const duree = Number(body.dureeJours) || cfg.dureeCampagneJours;
      c.statut = "en_cours";
      c.dateDebut = new Date().toISOString();
      c.dateFin = new Date(Date.now() + duree * 86400000).toISOString();
      await saveCampagnes(list, sha, `Publication ${c.id}`);
      await notifier(c.auteurEmail, "coproduction", `📚 Votre campagne « ${c.titre} » est en ligne ! Les lecteurs peuvent maintenant la soutenir.`, `/coproduction/${c.id}`);
      return NextResponse.json({ success: true, campagne: campagnePublique(c) });
    }

    // --- Contribution d'un utilisateur (débit du Solde Lisible) ---
    if (action === "contribuer") {
      const userEmail = (body.userEmail || "").toLowerCase().trim();
      const montantCAD = arr2(body.montantCAD);
      if (!userEmail || !(montantCAD >= cfg.contributionMinCAD)) {
        return NextResponse.json({ error: `Contribution minimale : ${cfg.contributionMinCAD} $ CA` }, { status: 400 });
      }
      if (montantCAD > cfg.contributionMaxCAD) {
        return NextResponse.json({ error: `Contribution maximale : ${cfg.contributionMaxCAD} $ CA` }, { status: 400 });
      }
      const { list, sha } = await getCampagnes();
      const c = list.find((x) => x.id === body.campagneId);
      if (!c) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
      if (c.statut !== "en_cours") return NextResponse.json({ error: "Cette campagne n'accepte plus de contributions" }, { status: 400 });
      if (new Date(c.dateFin) <= new Date()) {
        return NextResponse.json({ error: "Campagne terminée — clôture en cours" }, { status: 400 });
      }
      const liADebiter = cadToLi(montantCAD, cfg.tauxCADUSD);
      const fraisLi = Math.round((liADebiter * c.fraisDepotPct) / 100);
      const debit = await debiterLi(
        userEmail, liADebiter,
        `🤝 Contribution de ${montantCAD.toFixed(2)} $ CA à « ${c.titre} » (−${liADebiter.toLocaleString("fr-FR")} Li, dont ${fraisLi.toLocaleString("fr-FR")} Li de frais de dossier).`
      );
      if (!debit.ok) return NextResponse.json({ error: debit.error }, { status: 400 });
      const montantNetCAD = arr2(montantCAD * (1 - c.fraisDepotPct / 100));
      c.contributions.push({
        id: uid("contrib"), userEmail, montantCAD, montantNetCAD,
        liDebites: liADebiter, fraisLi, recuCAD: 0, date: new Date().toISOString(), statut: "active",
      });
      c.montantCollecteCAD = arr2(Number(c.montantCollecteCAD || 0) + montantNetCAD);
      await saveCampagnes(list, sha, `Contribution ${montantCAD}$ → ${c.id}`);
      await appendLedger({ type: "contribution", campagneId: c.id, de: userEmail, montantCAD, montantNetCAD, fraisLi, liDebites: liADebiter });
      return NextResponse.json({ success: true, montantNetCAD, nouveauSolde: debit.nouveauSolde });
    }

    // --- Date de sortie officielle (admin) : démarre la fenêtre de 12 mois ---
    if (action === "fixer-sortie") {
      if (!isAdmin(body.adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const { list, sha } = await getCampagnes();
      const c = list.find((x) => x.id === body.campagneId);
      if (!c) return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
      if (c.statut !== "financee") return NextResponse.json({ error: "La campagne doit être financée d'abord" }, { status: 400 });
      c.dateSortie = body.dateSortie || new Date().toISOString();
      c.statut = "en_vente";
      await saveCampagnes(list, sha, `Sortie officielle ${c.id}`);
      for (const co of c.contributions || []) {
        if (co.statut === "active" && !co.estPool) {
          await notifier(co.userEmail, "coproduction", `🎉 « ${c.titre} » est sorti ! Le partage des revenus commence : 60 % des recettes vous reviennent (plafond ${c.plafondPct} % de votre mise).`, `/coproduction/${c.id}`);
        }
      }
      return NextResponse.json({ success: true, campagne: campagnePublique(c) });
    }

    // --- Enregistrement d'une vente (admin, idempotent via "cle") ---
    if (action === "enregistrer-vente") {
      if (!isAdmin(body.adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const montantCAD = arr2(body.montantCAD);
      if (!(montantCAD > 0) || !body.campagneId) {
        return NextResponse.json({ error: "Campagne et montant requis" }, { status: 400 });
      }
      const vf = await getFile("data/coproduction/ventes.json");
      const ventes = vf && Array.isArray(vf.content) ? vf.content : [];
      if (body.cle && ventes.some((v) => v.cle === body.cle)) {
        return NextResponse.json({ success: true, doublon: true });
      }
      const { list } = await getCampagnes();
      const c = list.find((x) => x.id === body.campagneId);
      if (!c || (c.statut !== "en_vente" && c.statut !== "terminee")) {
        return NextResponse.json({ error: "Campagne non en vente" }, { status: 400 });
      }
      ventes.push({
        id: uid("vente"), campagneId: body.campagneId, montantCAD,
        canal: String(body.canal || "lisible").slice(0, 60),
        date: body.date || new Date().toISOString(),
        cle: body.cle || null, distribuee: false,
      });
      await updateFile("data/coproduction/ventes.json", ventes, vf ? vf.sha : null, `Vente ${montantCAD}$ ${body.campagneId}`);
      return NextResponse.json({ success: true });
    }

    // --- Achat de parts du Pool (débit du Solde Lisible) ---
    if (action === "acheter-part-pool") {
      const userEmail = (body.userEmail || "").toLowerCase().trim();
      const nbParts = Math.floor(Number(body.nbParts) || 0);
      if (!userEmail || nbParts < 1) return NextResponse.json({ error: "Nombre de parts invalide" }, { status: 400 });
      const coutCAD = arr2(nbParts * cfg.pool.prixPartCAD);
      const liADebiter = cadToLi(coutCAD, cfg.tauxCADUSD);
      const debit = await debiterLi(
        userEmail, liADebiter,
        `🏦 Achat de ${nbParts} part(s) du ${cfg.pool.nom} (${coutCAD.toFixed(2)} $ CA = ${liADebiter.toLocaleString("fr-FR")} Li).`
      );
      if (!debit.ok) return NextResponse.json({ error: debit.error }, { status: 400 });
      const pf = await getFile("data/coproduction/pool.json");
      const pool = pf ? pf.content : { parts: [], deploiements: [], distributions: [] };
      pool.parts.push({ id: uid("part"), userEmail, nbParts, montantCAD: coutCAD, date: new Date().toISOString() });
      await updateFile("data/coproduction/pool.json", pool, pf ? pf.sha : null, `Parts pool ${userEmail}`);
      await appendLedger({ type: "pool-part", de: userEmail, nbParts, montantCAD: coutCAD, liDebites: liADebiter });
      return NextResponse.json({ success: true, coutCAD, nouveauSolde: debit.nouveauSolde });
    }

    // --- Déploiement du Pool sur des campagnes (admin) ---
    if (action === "deployer-pool") {
      if (!isAdmin(body.adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const trimestre = String(body.trimestre || "").slice(0, 7); // AAAA-Tn
      const allocs = Array.isArray(body.allocations) ? body.allocations : [];
      if (!trimestre || allocs.length === 0 || allocs.length > 5) {
        return NextResponse.json({ error: "Trimestre + 1 à 5 campagnes requis" }, { status: 400 });
      }
      const { list, sha } = await getCampagnes();
      const pf = await getFile("data/coproduction/pool.json");
      const pool = pf ? pf.content : { parts: [], deploiements: [], distributions: [] };
      const capitalDispo = arr2(
        pool.parts.reduce((s, p) => s + Number(p.montantCAD || 0), 0) -
        pool.deploiements.reduce((s, d) => s + Number(d.montantCAD || 0), 0)
      );
      const totalAlloue = arr2(allocs.reduce((s, a) => s + Number(a.montantCAD || 0), 0));
      if (totalAlloue > capitalDispo) {
        return NextResponse.json({ error: `Capital disponible insuffisant (${capitalDispo.toFixed(2)} $ CA)` }, { status: 400 });
      }
      const deploiementIds = [];
      for (const a of allocs) {
        const c = list.find((x) => x.id === a.campagneId);
        if (!c || (c.statut !== "en_cours" && c.statut !== "financee")) {
          return NextResponse.json({ error: `Campagne invalide : ${a.campagneId}` }, { status: 400 });
        }
        const montantNetCAD = arr2(a.montantCAD);
        const depId = uid("dep");
        c.contributions.push({
          id: depId, userEmail: cfg.pool.emailPool, montantCAD: montantNetCAD, montantNetCAD,
          liDebites: 0, fraisLi: 0, recuCAD: 0, date: new Date().toISOString(), statut: "active", estPool: true,
        });
        if (c.statut === "en_cours") c.montantCollecteCAD = arr2(Number(c.montantCollecteCAD || 0) + montantNetCAD);
        pool.deploiements.push({
          id: depId, trimestre, campagneId: c.id, titre: c.titre,
          montantCAD: montantNetCAD, recuCAD: 0, distribueCAD: 0, date: new Date().toISOString(),
        });
        deploiementIds.push(depId);
      }
      await saveCampagnes(list, sha, `Déploiement pool ${trimestre}`);
      await updateFile("data/coproduction/pool.json", pool, pf ? pf.sha : null, `Déploiement pool ${trimestre}`);
      await appendLedger({ type: "pool-deploiement", trimestre, totalCAD: totalAlloue, nbCampagnes: allocs.length });
      return NextResponse.json({ success: true, deploiementIds, totalAlloue });
    }

    // --- Redistribution des gains du Pool aux détenteurs de parts (admin) ---
    if (action === "distribuer-pool") {
      if (!isAdmin(body.adminToken)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const trimestre = String(body.trimestre || "").slice(0, 7);
      const pf = await getFile("data/coproduction/pool.json");
      const pool = pf ? pf.content : { parts: [], deploiements: [], distributions: [] };
      const deps = pool.deploiements.filter((d) => d.trimestre === trimestre);
      if (deps.length === 0) return NextResponse.json({ error: "Aucun déploiement pour ce trimestre" }, { status: 400 });
      const gainsCAD = arr2(deps.reduce((s, d) => s + (Number(d.recuCAD || 0) - Number(d.distribueCAD || 0)), 0));
      if (!(gainsCAD > 0)) return NextResponse.json({ error: "Aucun gain à distribuer pour ce trimestre" }, { status: 400 });
      const fraisGestionCAD = arr2((gainsCAD * cfg.pool.fraisGestionPct) / 100);
      const netCAD = arr2(gainsCAD - fraisGestionCAD);
      const totalParts = pool.parts.reduce((s, p) => s + Number(p.nbParts || 0), 0);
      if (totalParts === 0) return NextResponse.json({ error: "Aucune part émise" }, { status: 400 });
      // Regroupe les parts par investisseur.
      const parInvestisseur = {};
      for (const p of pool.parts) {
        const k = (p.userEmail || "").toLowerCase();
        parInvestisseur[k] = (parInvestisseur[k] || 0) + Number(p.nbParts || 0);
      }
      const details = [];
      for (const [email, nb] of Object.entries(parInvestisseur)) {
        const partCAD = arr2((netCAD * nb) / totalParts);
        const li = await crediterLiCAD(
          email, partCAD, cfg.tauxCADUSD,
          `🏦 ${cfg.pool.nom} (${trimestre}) : +${partCAD.toFixed(2)} $ CA (${li.toLocaleString("fr-FR")} Li) — votre part des gains.`
        );
        details.push({ userEmail: email, nbParts: nb, montantCAD: partCAD, li });
      }
      for (const d of deps) d.distribueCAD = arr2(d.recuCAD || 0);
      pool.distributions.push({
        id: uid("pdist"), trimestre, totalCAD: gainsCAD, fraisGestionCAD, netCAD,
        nbBeneficiaires: details.length, date: new Date().toISOString(),
      });
      await updateFile("data/coproduction/pool.json", pool, pf.sha, `Distribution pool ${trimestre}`);
      await appendLedger({ type: "pool-distribution", trimestre, totalCAD: gainsCAD, fraisGestionCAD, netCAD });
      return NextResponse.json({ success: true, totalCAD: gainsCAD, fraisGestionCAD, netCAD, beneficiaires: details.length });
    }

    // ==================== ACTIONS CRON (automatiques) ====================

    // --- Clôture des campagnes arrivées à échéance ---
    if (action === "cloturer") {
      if (!isCron(body.cronSecret)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const { list, sha } = await getCampagnes();
      let modifie = false;
      const rapport = { financees: [], echouees: [], remboursements: 0, liRembourses: 0 };
      for (const c of list) {
        if (c.statut !== "en_cours" || !c.dateFin || new Date(c.dateFin) > new Date()) continue;
        if (Number(c.montantCollecteCAD || 0) >= Number(c.objectifCAD || 0)) {
          c.statut = "financee";
          modifie = true;
          rapport.financees.push(c.id);
          await notifier(c.auteurEmail, "coproduction", `🎯 Campagne « ${c.titre} » financée à ${Math.round((c.montantCollecteCAD / c.objectifCAD) * 100)} % ! Fixez la date de sortie officielle pour lancer le partage des revenus.`, `/coproduction/${c.id}`);
        } else {
          c.statut = "echouee";
          modifie = true;
          rapport.echouees.push(c.id);
          // Remboursement AUTOMATIQUE en Li (Solde Lisible), hors frais de dépôt.
          for (const co of c.contributions || []) {
            if (co.statut !== "active" || co.estPool) continue;
            const li = await crediterLiCAD(
              co.userEmail, co.montantNetCAD, cfg.tauxCADUSD,
              `↩️ Campagne « ${c.titre} » non financée : ${Number(co.montantNetCAD).toFixed(2)} $ CA recrédités en Li (${li.toLocaleString("fr-FR")} Li). Réinvestissez-les sur un autre projet !`
            );
            co.statut = "remboursee";
            rapport.remboursements += 1;
            rapport.liRembourses += li;
          }
          // Le Pool récupère sa mise dans son capital (pas de frais pour le Pool).
          for (const co of c.contributions || []) {
            if (co.statut === "active" && co.estPool) co.statut = "remboursee";
          }
          await notifier(c.auteurEmail, "coproduction", `La campagne « ${c.titre} » n'a pas atteint son objectif. Les contributeurs ont été remboursés automatiquement en Li.`, `/coproduction/${c.id}`);
        }
      }
      if (modifie) await saveCampagnes(list, sha, "Clôture automatique des campagnes");
      // Synchronise le statut des déploiements Pool des campagnes échouées.
      if (rapport.echouees.length > 0) {
        const pf = await getFile("data/coproduction/pool.json");
        if (pf) {
          let ch = false;
          for (const d of pf.content.deploiements || []) {
            if (rapport.echouees.includes(d.campagneId) && !d.rembourse) { d.rembourse = true; ch = true; }
          }
          if (ch) await updateFile("data/coproduction/pool.json", pf.content, pf.sha, "Remboursement pool campagnes échouées");
        }
      }
      return NextResponse.json({ success: true, rapport });
    }

    // --- Distribution des revenus (60/20/20 avec plafonds individuels) ---
    if (action === "distribuer") {
      if (!isCron(body.cronSecret)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const { list, sha } = await getCampagnes();
      const vf = await getFile("data/coproduction/ventes.json");
      const ventes = vf && Array.isArray(vf.content) ? vf.content : [];
      const vef = await getFile("data/coproduction/versements.json");
      const versements = vef && Array.isArray(vef.content) ? vef.content : [];
      const cutoff = new Date(Date.now() - cfg.delaiEncaissementJours * 86400000);
      let campagnesModifiees = false, ventesModifiees = false;
      const rapport = { campagnes: [] };

      for (const c of list) {
        if (c.statut !== "en_vente" || !c.dateSortie) continue;
        const finFenetre = new Date(new Date(c.dateSortie).getTime() + cfg.dureeMaxMois * 30.44 * 86400000);
        const aDistribuer = ventes.filter(
          (v) => v.campagneId === c.id && !v.distribuee && new Date(v.date) <= cutoff
        );
        if (aDistribuer.length === 0) {
          if (new Date() > finFenetre) { c.statut = "terminee"; campagnesModifiees = true; }
          continue;
        }
        const totalCAD = arr2(aDistribuer.reduce((s, v) => s + Number(v.montantCAD || 0), 0));
        const partCoproCAD = arr2((totalCAD * cfg.partCoproducteursPct) / 100);
        let partAuteurCAD = arr2((totalCAD * cfg.partAuteurPct) / 100);
        const partPlateformeCAD = arr2(totalCAD - partCoproCAD - partAuteurCAD);

        // Répartition aux coproducteurs : prorata des mises nettes, avec plafond individuel.
        const actifs = (c.contributions || []).filter((co) => co.statut === "active");
        const allocations = [];
        let reste = partCoproCAD;
        let eligibles = actifs.map((co) => ({
          co,
          plafond: arr2(Number(co.montantNetCAD || 0) * (c.plafondPct || cfg.plafondRemboursementPct) / 100),
        })).filter((e) => arr2(e.plafond - Number(e.co.recuCAD || 0)) > 0.009);
        while (reste > 0.009 && eligibles.length > 0) {
          const totalMises = eligibles.reduce((s, e) => s + Number(e.co.montantNetCAD || 0), 0);
          if (totalMises <= 0) break;
          let distribueTour = 0;
          const encore = [];
          for (const e of eligibles) {
            const capacite = arr2(e.plafond - Number(e.co.recuCAD || 0));
            let quote = arr2((reste * Number(e.co.montantNetCAD || 0)) / totalMises);
            quote = Math.min(quote, capacite, reste);
            if (quote > 0.009) {
              const existant = allocations.find((a) => a.co.id === e.co.id);
              if (existant) existant.montantCAD = arr2(existant.montantCAD + quote);
              else allocations.push({ co: e.co, montantCAD: quote });
              e.co.recuCAD = arr2(Number(e.co.recuCAD || 0) + quote);
              reste = arr2(reste - quote);
              distribueTour = arr2(distribueTour + quote);
            }
            if (arr2(e.plafond - Number(e.co.recuCAD || 0)) > 0.009) encore.push(e);
          }
          eligibles = encore;
          if (distribueTour <= 0.009) break;
        }
        if (reste > 0.009) {
          // Tous les coproducteurs ont atteint leur plafond : le reliquat revient à l'auteur.
          partAuteurCAD = arr2(partAuteurCAD + reste);
          reste = 0;
        }

        // Crédits.
        const details = [];
        for (const a of allocations) {
          if (a.co.estPool) {
            // La part du Pool reste dans le Pool (redistribuée ensuite aux détenteurs de parts).
            const pf = await getFile("data/coproduction/pool.json");
            if (pf) {
              const dep = (pf.content.deploiements || []).find((d) => d.id === a.co.id);
              if (dep) dep.recuCAD = arr2(Number(dep.recuCAD || 0) + a.montantCAD);
              await updateFile("data/coproduction/pool.json", pf.content, pf.sha, `Gains pool ${c.id}`);
            }
            details.push({ beneficiaire: "pool", montantCAD: a.montantCAD, li: 0 });
          } else {
            const li = await crediterLiCAD(
              a.co.userEmail, a.montantCAD, cfg.tauxCADUSD,
              `💰 Revenus « ${c.titre} » : +${a.montantCAD.toFixed(2)} $ CA (${li.toLocaleString("fr-FR")} Li) — votre part de coproducteur.`
            );
            details.push({ beneficiaire: a.co.userEmail, montantCAD: a.montantCAD, li });
          }
        }
        const liAuteur = await crediterLiCAD(
          c.auteurEmail, partAuteurCAD, cfg.tauxCADUSD,
          `✍️ Revenus « ${c.titre} » : +${partAuteurCAD.toFixed(2)} $ CA (${liAuteur.toLocaleString("fr-FR")} Li) — votre part d'auteur (20 %).`
        );
        for (const v of aDistribuer) { v.distribuee = true; v.dateDistribution = new Date().toISOString(); ventesModifiees = true; }
        versements.push({
          id: uid("vers"), campagneId: c.id, date: new Date().toISOString(),
          totalCAD, partCoproducteursCAD: arr2(partCoproCAD - reste), partAuteurCAD, partPlateformeCAD,
          ventesDistribuees: aDistribuer.length, details,
        });

        // Fin de campagne : tous les plafonds atteints ou 12 mois écoulés.
        const tousPlafonnes = actifs.length > 0 && actifs.every((co) => {
          const plafond = arr2(Number(co.montantNetCAD || 0) * (c.plafondPct || cfg.plafondRemboursementPct) / 100);
          return Number(co.recuCAD || 0) >= plafond - 0.01;
        });
        if (tousPlafonnes || new Date() > finFenetre) {
          c.statut = "terminee";
          for (const co of actifs) {
            if (!co.estPool) {
              await notifier(co.userEmail, "coproduction", `🏁 Partage des revenus terminé pour « ${c.titre} ». Total perçu : ${Number(co.recuCAD || 0).toFixed(2)} $ CA. Merci pour votre soutien !`, `/coproduction/${c.id}`);
            }
          }
        }
        campagnesModifiees = true;
        rapport.campagnes.push({ id: c.id, totalCAD, beneficiaires: details.length });
        await appendLedger({ type: "distribution", campagneId: c.id, totalCAD, partAuteurCAD, partPlateformeCAD, nbBeneficiaires: details.length });
      }

      if (campagnesModifiees) await saveCampagnes(list, sha, "Distribution des revenus");
      if (ventesModifiees) await updateFile("data/coproduction/ventes.json", ventes, vf ? vf.sha : null, "Ventes distribuées");
      if (rapport.campagnes.length > 0) {
        await updateFile("data/coproduction/versements.json", versements.slice(-2000), vef ? vef.sha : null, "Versements coproduction");
      }
      return NextResponse.json({ success: true, rapport });
    }

    // --- Clause de solde inactif (mensuelle) ---
    if (action === "inactivite") {
      if (!isCron(body.cronSecret)) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
      const dir = await getFile("data/users");
      const files = dir && dir.isDir ? dir.content.filter((x) => x.name.endsWith(".json")) : [];
      const maintenant = new Date();
      const rapport = { avertis: 0, debites: 0, liDebites: 0 };
      const fraisLi = cadToLi(cfg.inactivite.fraisMensuelsCAD, cfg.tauxCADUSD);
      for (const fl of files) {
        let uf;
        try {
          uf = await getFile(`data/users/${fl.name}`);
        } catch { continue; }
        if (!uf || !uf.content) continue;
        const u = uf.content;
        const solde = Number(u.li || 0);
        if (solde <= 0) continue;
        const ref = u.derniereActivite || u.lastSync || u.created_at;
        if (!ref) continue;
        const moisInactif = (maintenant - new Date(ref)) / (30.44 * 86400000);
        if (moisInactif < cfg.inactivite.preavisMois) continue;
        if (moisInactif < cfg.inactivite.moisSansActivite) {
          // Préavis unique à 11 mois.
          if (!u.avertissementInactivite) {
            u.avertissementInactivite = maintenant.toISOString();
            u.notifications = [
              { id: uid("inact"), type: "warning", message: `⚠️ Votre solde de ${solde.toLocaleString("fr-FR")} Li est inactif depuis près d'un an. Sans activité de votre part, des frais de gestion de ${cfg.inactivite.fraisMensuelsCAD} $ CA/mois seront prélevés à partir du ${cfg.inactivite.moisSansActivite}e mois d'inactivité (voir CGU, clause de solde inactif). Connectez-vous ou utilisez vos Li pour éviter ces frais.`, link: "/portefeuille", date: maintenant.toISOString(), read: false },
              ...(u.notifications || []),
            ].slice(0, 100);
            await updateFile(`data/users/${fl.name}`, u, uf.sha, `Préavis inactivité ${u.email}`);
            rapport.avertis += 1;
          }
          continue;
        }
        // Débit mensuel (une fois par mois calendaire).
        const cleMois = `inact_${monthKey(maintenant)}`;
        u.fraisInactivitePreleves = u.fraisInactivitePreleves || [];
        if (u.fraisInactivitePreleves.includes(cleMois)) continue;
        const debit = Math.min(fraisLi, solde);
        u.li = solde - debit;
        u.fraisInactivitePreleves.push(cleMois);
        u.notifications = [
          { id: uid("inact"), type: "warning", message: `⏳ Frais de solde inactif : −${debit.toLocaleString("fr-FR")} Li (${cfg.inactivite.fraisMensuelsCAD} $ CA) prélevés sur votre solde inutilisé depuis plus d'un an (CGU, clause de solde inactif). Utilisez vos Li pour stopper ces frais.`, link: "/portefeuille", date: maintenant.toISOString(), read: false },
          ...(u.notifications || []),
        ].slice(0, 100);
        await updateFile(`data/users/${fl.name}`, u, uf.sha, `Frais inactivité ${u.email}`);
        rapport.debites += 1;
        rapport.liDebites += debit;
        await appendLedger({ type: "frais-inactivite", de: u.email, li: debit });
      }
      return NextResponse.json({ success: true, rapport });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("[coproduction] POST:", e.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
