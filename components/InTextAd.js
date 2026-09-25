"use client";
import { useEffect, useRef } from "react";

// Le tag Monetag ne doit être injecté QU'UNE SEULE FOIS par page,
// même si plusieurs encarts sont rendus (un tag par page suffit,
// les doublons ne servent à rien et alourdissent le chargement).
// Zone "Lisible In-Text" (ID 11888115) — format In-Page Push (Banner),
// créée le 2026-09-25 : s'affiche comme une bannière native discrète.
let monetagTagInjecte = false;

function injecterTagMonetag() {
  if (monetagTagInjecte) return;
  monetagTagInjecte = true;
  if (typeof document === "undefined") return;
  const s = document.createElement("script");
  s.src = "https://nap5k.com/tag.min.js";
  s.setAttribute("data-zone", "11888115");
  s.async = true;
  s.setAttribute("data-cfasync", "false");
  document.body.appendChild(s);
}

/**
 * Encart publicitaire discret entre les paragraphes.
 * - Compact : marges réduites, mention "Sponsorisé" minuscule et discrète.
 * - Auto-repli : si aucune publicité ne remplit l'encart après 6 s,
 *   il se masque complètement pour ne laisser aucun vide disgracieux.
 */
export default function InTextAd() {
  const ref = useRef(null);

  useEffect(() => {
    injecterTagMonetag();
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(() => {
      // Une publicité effectivement affichée injecte iframe / img / ins / lien.
      const rempli = el.querySelector("iframe, img, ins, object, embed, a[href]");
      if (!rempli) el.style.display = "none";
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={ref}
      data-ad-slot="intext"
      className="w-full flex flex-col items-center my-3 clear-both"
      aria-hidden="true"
    >
      <span className="text-[9px] uppercase tracking-widest text-stone-400 select-none">
        Sponsorisé
      </span>
      <div className="w-full flex justify-center" data-ad-zone="11888115" />
    </div>
  );
}
