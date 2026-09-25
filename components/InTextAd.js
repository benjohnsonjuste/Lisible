"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ADSTERRA_INVOKE_BASE, INTEXT_MOBILE } from "./adsterraPlacements";

/**
 * Bannière publicitaire in-text (Adsterra, format "Banner" display).
 *
 * - La bannière tourne dans une iframe srcDoc isolée : le script Adsterra
 *   (atOptions + invoke.js, document.write) ne peut ni effacer la page
 *   React ni entrer en conflit avec les autres bannières.
 * - Discrète : marges réduites, mention "Sponsorisé" minuscule.
 * - Auto-repli : si aucune publicité ne remplit l'iframe après 7 s,
 *   l'encart disparaît complètement (aucun vide disgracieux).
 *
 * @param {{key:string,width:number,height:number}} placement - le placement
 *   Adsterra à afficher. Sans placement (défaut), affiche le 300x250 mobile,
 *   une taille sûre sur tous les écrans.
 */
export default function InTextAd({ placement = INTEXT_MOBILE[1] }) {
  const [visible, setVisible] = useState(true);
  const iframeRef = useRef(null);

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
      "</body></html>"
    );
  }, [placement]);

  useEffect(() => {
    if (!placement) return;
    const t = setTimeout(() => {
      try {
        const doc = iframeRef.current && iframeRef.current.contentDocument;
        // Une bannière servie injecte iframe / img / objet média dans le document.
        const rempli =
          doc && doc.querySelector("iframe, img, object, embed, video, canvas, a[href]");
        if (!rempli) setVisible(false);
      } catch (e) {
        setVisible(false);
      }
    }, 7000);
    return () => clearTimeout(t);
  }, [placement]);

  if (!placement || !visible) return null;

  return (
    <div
      data-ad-slot="intext-adsterra"
      className="w-full flex flex-col items-center my-3 clear-both"
      aria-hidden="true"
    >
      <span className="text-[9px] uppercase tracking-widest text-stone-400 select-none">
        Sponsorisé
      </span>
      <iframe
        ref={iframeRef}
        title="Publicité"
        srcDoc={srcDoc}
        width={placement.width}
        height={placement.height}
        scrolling="no"
        style={{ border: 0, maxWidth: "100%", display: "block", overflow: "hidden" }}
      />
    </div>
  );
}
