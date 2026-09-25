import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getSessionUser } from "../_lib/session.js";
import { getFile, updateFile } from "../_lib/github.js";
import { CGU_VERSION, CGU_TEXTE } from "../../../lib/coffre-fort.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Coffre-Fort d'Horodatage — Certificat d'Ancrage Littéraire (Lisible.biz)
// Service GRATUIT : scelle l'antériorité d'une œuvre en 1 clic.
//  - Empreinte cryptographique SHA-256 unique du texte déposé
//  - Horodatage certifié et infalsifiable (date + heure UTC exactes)
//  - Certificat PDF officiel, sceau d'encre Lisible, vérifiable en ligne
// ---------------------------------------------------------------------------

const DIR = "data/horodatage";
const INDEX_PATH = `${DIR}/index.json`;

// --- Utilitaires ------------------------------------------------------------

const norm = (s) => String(s || "").replace(/\r\n/g, "\n").trim();

function canonical(title, authorName, authorEmail, content) {
  return [
    "LISIBLE-HORODATAGE-V1",
    norm(title),
    norm(authorName),
    norm(authorEmail).toLowerCase(),
    norm(content),
  ].join("\n");
}

const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

function nouveauId() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = createHash("sha256")
    .update(`${Date.now()}-${Math.random()}-${process.hrtime.bigint()}`)
    .digest();
  let r = "";
  for (let i = 0; i < 6; i++) r += abc[buf[i] % abc.length];
  return `LIS-${new Date().getUTCFullYear()}-${r}`;
}

const publicCert = (c) => ({
  id: c.id,
  textId: c.textId,
  titre: c.titre,
  auteur: c.auteur,
  auteurEmail: c.auteurEmail,
  hash: c.hash,
  algorithme: c.algorithme,
  mots: c.mots,
  caracteres: c.caracteres,
  deposeLe: c.deposeLe,
  cguVersion: c.declaration?.cguVersion || CGU_VERSION,
});

function dateFr(iso) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
function heureFr(iso) {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
}

// --- POST : sceller / pdf ---------------------------------------------------

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    // ----- Génération du PDF (publique : le certificat est vérifiable par tous)
    if (action === "pdf") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
      const f = await getFile(`${DIR}/certificats/${String(id).toUpperCase()}.json`);
      if (!f) return NextResponse.json({ error: "Certificat introuvable." }, { status: 404 });
      const pdfBytes = await genererPDF(f.content);
      return new Response(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Certificat-Anteriorite-${f.content.id}.pdf"`,
        },
      });
    }

    // ----- Scellement (réservé à l'auteur, session serveur requise)
    if (action === "sceller") {
      const { textId, sessionToken, cgu } = body;
      if (!textId) return NextResponse.json({ error: "Texte manquant." }, { status: 400 });
      if (!cgu) return NextResponse.json({ error: "Vous devez accepter les conditions du Coffre-Fort." }, { status: 400 });

      let user = null;
      try {
        user = sessionToken ? await getSessionUser(sessionToken) : null;
      } catch {
        user = null;
      }
      if (!user?.email)
        return NextResponse.json({ error: "Session requise. Reconnectez-vous." }, { status: 401 });

      const textPath = `data/texts/${textId}.json`;
      const textFile = await getFile(textPath);
      if (!textFile) return NextResponse.json({ error: "Texte introuvable." }, { status: 404 });
      const t = textFile.content || {};
      const auteurEmail = norm(t.authorEmail).toLowerCase();
      if (auteurEmail !== norm(user.email).toLowerCase())
        return NextResponse.json({ error: "Seul l'auteur peut sceller son œuvre." }, { status: 403 });

      // Idempotent : un texte déjà scellé renvoie son certificat existant
      if (t.horodatage?.id) {
        const exist = await getFile(`${DIR}/certificats/${t.horodatage.id}.json`);
        if (exist) return NextResponse.json({ success: true, certificat: publicCert(exist.content), dejaScelle: true });
      }

      const titre = norm(t.title) || "Sans titre";
      const auteur = norm(t.authorName || t.author) || "Une Plume";
      const contenu = norm(t.content);
      if (!contenu) return NextResponse.json({ error: "Impossible de sceller un texte vide." }, { status: 400 });

      const canon = canonical(titre, auteur, auteurEmail, contenu);
      const hash = sha256(canon);
      const id = nouveauId();
      const deposeLe = new Date().toISOString();
      const mots = contenu.split(/\s+/).filter(Boolean).length;

      const record = {
        id,
        textId,
        titre,
        auteur,
        auteurEmail,
        hash,
        algorithme: "SHA-256",
        mots,
        caracteres: contenu.length,
        deposeLe,
        declaration: {
          cguVersion: CGU_VERSION,
          accepteLe: deposeLe,
          texte: CGU_TEXTE,
        },
        snapshot: canon,
      };

      // 1. Fichier certificat complet
      const putCert = await updateFile(`${DIR}/certificats/${id}.json`, record, null, `🔏 Certificat ${id}`);
      if (!putCert.ok) throw new Error("Échec d'enregistrement du certificat.");

      // 2. Index léger
      const idx = await getFile(INDEX_PATH);
      const arr = Array.isArray(idx?.content?.certificats) ? idx.content.certificats : [];
      arr.unshift({ id, textId, titre, auteur, deposeLe, hash });
      await updateFile(INDEX_PATH, { certificats: arr }, idx?.sha || null, `🔏 Index horodatage ${id}`);

      // 3. Tampon sur le texte (badge rapide)
      t.horodatage = { id, deposeLe, hash };
      await updateFile(textPath, t, textFile.sha, `🔏 Scellement ${id}`);

      return NextResponse.json({ success: true, certificat: publicCert(record) });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Erreur serveur." }, { status: 500 });
  }
}

// --- GET : certificat public + vérification ---------------------------------

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    const f = await getFile(`${DIR}/certificats/${String(id).toUpperCase()}.json`);
    if (!f) return NextResponse.json({ error: "Certificat introuvable." }, { status: 404 });
    const c = f.content;
    // Vérification : l'empreinte recalculée du texte déposé doit correspondre
    const verifie = c.snapshot ? sha256(c.snapshot) === c.hash : false;
    return NextResponse.json({ success: true, certificat: publicCert(c), verifie });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Erreur serveur." }, { status: 500 });
  }
}

// --- Génération du PDF haute qualité ----------------------------------------

function wrap(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function genererPDF(c) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const W = 595.28;
  const H = 841.89;

  const times = await pdf.embedFont(StandardFonts.TimesRoman);
  const timesB = await pdf.embedFont(StandardFonts.TimesBold);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);

  const IVOIRE = rgb(0.992, 0.98, 0.961);
  const NOIR = rgb(0.05, 0.05, 0.06);
  const OR = rgb(0.69, 0.55, 0.18);
  const OR_FONCE = rgb(0.45, 0.34, 0.1);
  const ENCRE = rgb(0.12, 0.12, 0.14);
  const ROUGE_SCEAU = rgb(0.6, 0.1, 0.1);
  const GRIS = rgb(0.45, 0.45, 0.47);

  // Fond ivoire
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: IVOIRE });

  // Bandeau noir supérieur + logo or
  const BAND_H = 150;
  page.drawRectangle({ x: 0, y: H - BAND_H, width: W, height: BAND_H, color: NOIR });
  try {
    const logoRes = await fetch("https://lisible.biz/images/logo-lisible.png", { cache: "no-store" });
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      const logo = await pdf.embedPng(logoBytes);
      const lh = 96;
      const lw = (lh * logo.width) / logo.height;
      page.drawImage(logo, { x: (W - lw) / 2, y: H - BAND_H + (BAND_H - lh) / 2, width: lw, height: lh });
    }
  } catch {
    /* sans logo : le titre suffit */
  }
  // Filet or sous le bandeau
  page.drawLine({ start: { x: 0, y: H - BAND_H }, end: { x: W, y: H - BAND_H }, thickness: 3, color: OR });

  // Double bordure ornementale
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - BAND_H - 30, borderColor: OR, borderWidth: 2 });
  page.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - BAND_H - 46, borderColor: OR_FONCE, borderWidth: 0.75 });

  const cx = W / 2;
  let y = H - BAND_H - 70;

  // Titre
  page.drawText("Certificat d'Antériorité Littéraire", {
    x: cx - timesB.widthOfTextAtSize("Certificat d'Antériorité Littéraire", 27) / 2,
    y, size: 27, font: timesB, color: ENCRE,
  });
  y -= 28;
  const sous = "COFFRE-FORT D'HORODATAGE · LISIBLE.BIZ";
  page.drawText(sous, {
    x: cx - helv.widthOfTextAtSize(sous, 10) / 2,
    y, size: 10, font: helv, color: OR_FONCE,
  });
  y -= 22;
  page.drawLine({ start: { x: cx - 90, y }, end: { x: cx + 90, y }, thickness: 1, color: OR });
  y -= 34;

  // Attestation
  const att = `L'archive Lisible atteste que l'œuvre « ${c.titre} », de la plume de ${c.auteur}, a été déposée au Coffre-Fort d'Horodatage le ${dateFr(c.deposeLe)} à ${heureFr(c.deposeLe)} UTC. L'empreinte cryptographique ci-dessous garantit l'intégrité du texte tel que déposé et témoigne de son antériorité.`;
  for (const ln of wrap(att, times, 12.5, W - 170)) {
    page.drawText(ln, { x: cx - times.widthOfTextAtSize(ln, 12.5) / 2, y, size: 12.5, font: times, color: ENCRE });
    y -= 19;
  }
  y -= 16;

  // Champs
  const champ = (label, value, mono = false) => {
    const f = mono ? helv : timesB;
    const s = mono ? 7.5 : 12;
    page.drawText(label.toUpperCase(), { x: 90, y, size: 8.5, font: helvB, color: OR_FONCE });
    y -= 15;
    const fontV = mono ? helv : times;
    const maxW = W - 180;
    const lines = mono
      ? [value.slice(0, 32), value.slice(32, 64)].filter(Boolean)
      : wrap(value, fontV, s, maxW);
    for (const ln of lines) {
      page.drawText(ln, { x: 90, y, size: s, font: fontV, color: ENCRE });
      y -= mono ? 11 : 16;
    }
    y -= 8;
  };

  champ("N° de certificat", c.id);
  champ("Œuvre", `« ${c.titre} »`);
  champ("Auteur", c.auteur);
  champ("Déposé le", `${dateFr(c.deposeLe)} à ${heureFr(c.deposeLe)} UTC`);
  champ("Empreinte cryptographique (SHA-256)", c.hash, true);
  champ("Volume", `${c.mots} mots · ${c.caracteres} caractères`);

  // Sceau d'encre rouge
  const sx = cx;
  const sy = 150;
  page.drawCircle({ x: sx, y: sy, size: 58, borderColor: ROUGE_SCEAU, borderWidth: 2.5 });
  page.drawCircle({ x: sx, y: sy, size: 48, borderColor: ROUGE_SCEAU, borderWidth: 1 });
  const sceauTxt = (txt, dy, size, font) => {
    page.drawText(txt, { x: sx - font.widthOfTextAtSize(txt, size) / 2, y: sy + dy, size, font, color: ROUGE_SCEAU });
  };
  sceauTxt("LISIBLE", 12, 15, helvB);
  sceauTxt("★ ★ ★", -6, 9, helv);
  sceauTxt("HORODATAGE", -22, 8.5, helvB);
  sceauTxt("CERTIFIÉ", -34, 8.5, helvB);

  // Pied de page
  const verif = `Vérifiable à tout moment : lisible.biz/certificat/${c.id}`;
  page.drawText(verif, {
    x: cx - helv.widthOfTextAtSize(verif, 8.5) / 2, y: 62, size: 8.5, font: helv, color: GRIS,
  });
  const gen = "Document officiel généré par Lisible · Service gratuit";
  page.drawText(gen, {
    x: cx - helv.widthOfTextAtSize(gen, 8) / 2, y: 48, size: 8, font: helv, color: GRIS,
  });

  return await pdf.save();
}
