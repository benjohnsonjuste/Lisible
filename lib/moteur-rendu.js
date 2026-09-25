// ---------------------------------------------------------------------------
// Moteur de rendu du Studio Vidéo — dessin image par image sur canvas 2D.
// Fonction pure (aucun accès DOM hors ctx) : testable avec un ctx factice.
// ---------------------------------------------------------------------------

import {
  INTRO_DUREE,
  OUTRO_DUREE,
  LARGEUR,
  HAUTEUR,
  versetCourant,
} from "./video-studio.js";

// Découpe un texte en lignes tenant dans maxLargeur (retour à la ligne auto).
export function decouperLignes(ctx, texte, maxLargeur) {
  const mots = String(texte).split(/\s+/).filter(Boolean);
  const lignes = [];
  let ligne = "";
  for (const m of mots) {
    const test = ligne ? `${ligne} ${m}` : m;
    if (ctx.measureText(test).width > maxLargeur && ligne) {
      lignes.push(ligne);
      ligne = m;
    } else {
      ligne = test;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes.length ? lignes : [""];
}

function texteCentre(ctx, lignes, cx, yDepart, interligne) {
  let y = yDepart;
  for (const l of lignes) {
    ctx.fillText(l, cx, y);
    y += interligne;
  }
  return y;
}

// Dessine l'image correspondant à l'instant t (secondes).
// assets: { theme, titre, auteur, versets, slots, dureeTotale, logo (Image|null), qr (Image|null) }
export function dessinerImage(ctx, assets, t) {
  const { theme, titre, auteur, versets, slots, dureeTotale, logo, qr } = assets;
  const W = LARGEUR;
  const H = HAUTEUR;
  const cx = W / 2;

  // Fond
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, theme.fondHaut);
  grad.addColorStop(1, theme.fondBas);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const phaseIntro = t < INTRO_DUREE;
  const phaseOutro = t > dureeTotale - OUTRO_DUREE;

  if (phaseIntro) {
    const p = Math.min(1, t / 1.2); // fondu d'entrée
    ctx.globalAlpha = p;
    if (logo) {
      const lw = 300;
      const lh = (lw * logo.height) / logo.width;
      ctx.drawImage(logo, cx - lw / 2, 620, lw, lh);
    }
    ctx.fillStyle = theme.doux;
    ctx.font = "600 34px system-ui, sans-serif";
    ctx.fillText("P R É S E N T E", cx, 1050);
    ctx.fillStyle = theme.texte;
    ctx.font = "italic 700 72px Georgia, serif";
    const lt = decouperLignes(ctx, `« ${titre} »`, W - 160);
    texteCentre(ctx, lt, cx, 1150 - ((lt.length - 1) * 44), 88);
    ctx.fillStyle = theme.accent;
    ctx.font = "600 40px Georgia, serif";
    ctx.fillText(auteur, cx, 1150 + lt.length * 44 + 40);
    ctx.globalAlpha = 1;
  } else if (phaseOutro) {
    const p = Math.min(1, (t - (dureeTotale - OUTRO_DUREE)) / 0.8);
    ctx.globalAlpha = p;
    ctx.fillStyle = theme.texte;
    ctx.font = "600 40px system-ui, sans-serif";
    ctx.fillText("RETROUVEZ CE TEXTE SUR", cx, 560);
    if (qr) {
      const q = 440;
      // pastille claire derrière le QR pour le contraste
      ctx.fillStyle = "#ffffff";
      const m = 28;
      ctx.fillRect(cx - q / 2 - m, 660 - m, q + m * 2, q + m * 2);
      ctx.drawImage(qr, cx - q / 2, 660, q, q);
    }
    ctx.fillStyle = theme.accent;
    ctx.font = "700 76px Georgia, serif";
    ctx.fillText("lisible.biz", cx, 1260);
    if (logo) {
      const lw = 220;
      const lh = (lw * logo.height) / logo.width;
      ctx.drawImage(logo, cx - lw / 2, 1360, lw, lh);
    }
    ctx.globalAlpha = 1;
  } else {
    // Phase versets
    const idx = versetCourant(slots, t);
    // Versets précédents (atténués)
    ctx.textAlign = "center";
    for (let k = 2; k >= 1; k--) {
      const j = idx - k;
      if (j < 0) continue;
      const lignes = decouperLignes(ctx, versets[j], W - 220);
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = theme.doux;
      ctx.font = "italic 400 40px Georgia, serif";
      texteCentre(ctx, lignes.slice(0, 2), cx, 420 + (2 - k) * 130, 52);
    }
    ctx.globalAlpha = 1;
    if (idx >= 0) {
      const slot = slots[idx];
      const fade = Math.min(1, (t - slot.debut) / 0.4);
      ctx.globalAlpha = fade;
      const brut = versets[idx];
      let taille = 68;
      let lignes;
      for (;;) {
        ctx.font = `italic 700 ${taille}px Georgia, serif`;
        lignes = decouperLignes(ctx, brut, W - 140);
        if (lignes.length <= 7 || taille <= 44) break;
        taille -= 6;
      }
      ctx.fillStyle = theme.texte;
      // Barre d'accent au-dessus
      const bw = 120;
      ctx.fillStyle = theme.accent;
      ctx.fillRect(cx - bw / 2, 800, bw, 6);
      ctx.fillStyle = theme.texte;
      const blocH = lignes.length * (taille * 1.35);
      texteCentre(ctx, lignes, cx, 960 - blocH / 2 + taille * 0.5, taille * 1.35);
      // Compteur discret
      ctx.globalAlpha = fade * 0.6;
      ctx.fillStyle = theme.doux;
      ctx.font = "600 30px system-ui, sans-serif";
      ctx.fillText(`${idx + 1} / ${versets.length}`, cx, 1500);
      ctx.globalAlpha = 1;
    }
  }

  // Filigrane permanent
  if (!phaseOutro) {
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = theme.doux;
    ctx.font = "700 30px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Lisible.biz", cx, H - 70);
    ctx.globalAlpha = 1;
  }
}
