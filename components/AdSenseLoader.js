"use client";
import React, { useEffect } from "react";
import { CONSENT_KEY, CONSENT_EVENT } from "./CookieConsent";

const ADSENSE_CLIENT = "ca-pub-7644995408680119";
const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
const SCRIPT_ID = "lisible-adsense-script";

/**
 * Charge le script officiel Google AdSense UNIQUEMENT après consentement
 * explicite de l'utilisateur (bandeau cookies -> "Accepter").
 * Sans consentement, aucune requête publicitaire n'est émise.
 */
export default function AdSenseLoader() {
  useEffect(() => {
    const inject = () => {
      if (document.getElementById(SCRIPT_ID)) return;
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.async = true;
      s.src = ADSENSE_SRC;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    };

    const onConsentChange = (e) => {
      if (e.detail === "accepted") inject();
    };

    try {
      if (localStorage.getItem(CONSENT_KEY) === "accepted") inject();
    } catch {}

    window.addEventListener(CONSENT_EVENT, onConsentChange);
    return () => window.removeEventListener(CONSENT_EVENT, onConsentChange);
  }, []);

  return null;
}
