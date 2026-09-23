"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

export const CONSENT_KEY = "lisible_cookie_consent";
export const CONSENT_EVENT = "lisible-consent-changed";

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {}
}

/**
 * Bandeau de consentement aux cookies (français).
 * S'affiche en bas de page tant que l'utilisateur n'a pas fait son choix.
 * Le choix est mémorisé dans localStorage.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) {
      // Léger délai pour ne pas masquer le premier affichage de la page
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="bg-slate-950 text-white rounded-[1.75rem] p-6 md:p-7 shadow-2xl shadow-slate-950/40 border border-white/10">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
            <Cookie size={22} />
          </div>
          <div className="space-y-2">
            <h2 className="font-black text-sm uppercase tracking-widest">
              Nous respectons votre vie privée
            </h2>
            <p className="text-[13px] leading-relaxed text-slate-300">
              Lisible utilise des cookies pour améliorer votre expérience et, avec
              votre accord, pour afficher des publicités personnalisées via nos
              partenaires, dont Google AdSense.{" "}
              <Link
                href="/confidentialite"
                className="text-teal-400 font-bold underline underline-offset-2 hover:text-teal-300"
              >
                En savoir plus
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-5">
          <button
            onClick={() => choose("accepted")}
            className="flex-1 px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
          >
            Accepter
          </button>
          <button
            onClick={() => choose("refused")}
            className="flex-1 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all active:scale-95"
          >
            Refuser
          </button>
        </div>
        <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
          Vous pouvez modifier votre choix à tout moment depuis la page{" "}
          <Link href="/confidentialite" className="underline underline-offset-2 hover:text-slate-300">
            Confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
