"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ADSTERRA_INVOKE_BASE,
  INTEXT_MOBILE,
  INTEXT_DESKTOP,
} from "./adsterraPlacements";

/**
 * Bannière publicitaire générique (Adsterra, format "Banner" display).
 *
 * - La bannière tourne dans une iframe srcDoc isolée : le script Adsterra
 *   (atOptions + invoke.js, document.write) ne peut ni effacer la page
 *   React ni entrer en conflit avec les autres bannières.
 * - SÉCURITÉ : l'iframe est "sandboxée" (sans allow-same-origin) : une créa
 *   agressive ne peut PAS toucher la page parente (pas d'overlay plein écran
 *   injecté, pas de détournement du titre, pas de redirection). Les clics
 *   publicitaires restent possibles (ouverture dans un nouvel onglet).
 * - Discrète : mention "Sponsorisé" minuscule au-dessus.
 * - Auto-repli : si aucune publicité ne remplit l'iframe après ~9 s,
 *   l'encart disparaît complètement (aucun vide disgracieux). La détection
 *   passe par postMessage (le sandbox interdit l'inspection directe du DOM
 *   de l'iframe) ; chaque instance a un identifiant unique.
 *
 * Contrainte Adsterra : un code = UN SEUL slot par page. Chaque clé ne doit
 * donc être utilisée qu'une fois par page rendue.
 *
 * @param {{key:string,width:number,height:number}} placement - placement Adsterra.
 * @param {string} className - classes additionnelles sur le conteneur.
 */
export default function AdBanner({ placement, className = "" }) {
  const [visible, setVisible] = useState(true);
  const slotId = useRef(
    "adslot-" + Math.random().toString(36).slice(2, 10)
  ).current;

  const srcDoc = useMemo(() => {
    if (!placement) return "";
    const { key, width, height } = placement;
    return (
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
      "<style>html,body{margin:0;padding:0;background:transparent}</style>" +
      "</head><body>" +
      "<script>atOptions={'key':'" + key + "','format':'iframe','height':" + height +
      ",'width':" + width + ",'params':{}};</script>" +
      "<script src=\"" + ADSTERRA_INVOKE_BASE + "/" + key + "/invoke.js\"></script>" +
      // Sonde de remplissage : signale au parent si une créa s'est affichée.
      // (postMessage fonctionne même avec une iframe sandboxée d'origine opaque.)
      "<script>setTimeout(function(){try{" +
      "var rempli=!!document.querySelector('iframe,img,object,embed,video,canvas,a[href]');" +
      "parent.postMessage({lisibleAdFill:rempli,slot:'" + slotId + "'},'*');" +
      "}catch(e){try{parent.postMessage({lisibleAdFill:false,slot:'" + slotId + "'},'*');}catch(_){}}" +
      "},4000);</script>" +
      "</body></html>"
    );
  }, [placement, slotId]);

  useEffect(() => {
    if (!placement) return;
    let settled = false;
    const onMessage = (e) => {
      const d = e && e.data;
      if (!d || d.slot !== slotId || typeof d.lisibleAdFill === "undefined") return;
      settled = true;
      if (!d.lisibleAdFill) setVisible(false);
    };
    window.addEventListener("message", onMessage);
    // Sécurité : aucun signal après 9 s → on replie l'encart.
    const t = setTimeout(() => {
      if (!settled) setVisible(false);
    }, 9000);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(t);
    };
  }, [placement, slotId]);

  if (!placement || !visible) return null;

  return (
    <div
      data-ad-slot="adsterra-banner"
      className={`w-full flex flex-col items-center my-4 clear-both ${className}`}
      aria-hidden="true"
    >
      <span className="text-[9px] uppercase tracking-widest text-stone-400 select-none">
        Sponsorisé
      </span>
      <iframe
        title="Publicité"
        srcDoc={srcDoc}
        width={placement.width}
        height={placement.height}
        scrolling="no"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        style={{ border: 0, maxWidth: "100%", display: "block", overflow: "hidden" }}
      />
    </div>
  );
}

/**
 * Détecte mobile (<640px) / desktop et renvoie les placements Adsterra
 * adaptés à la section. Utilisation :
 *
 *   const placements = useAdPlacements("strip"); // ou "box"
 *   {placements && <AdBanner placement={placements[0]} />}
 *
 * - "strip" : bannière fine pleine largeur (sous un header, au-dessus d'une grille)
 * - "box"   : pavé compact (dans une grille, sous un lecteur)
 */
export function useAdPlacements(kind = "strip") {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isMobile === null) return null;

  const mobile = INTEXT_MOBILE; // [0] = 320x50 strip, [1] = 300x250 box
  const desktop = INTEXT_DESKTOP; // [0] = 728x90 strip, [1] = 468x60 strip fin, [2] = 300x250 box

  if (kind === "box") {
    return isMobile ? [mobile[1]] : [desktop[2]];
  }
  // "strip" par défaut
  return isMobile ? [mobile[0]] : [desktop[0]];
}
