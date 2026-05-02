"use client";

import Script from 'next/script';

// AJOUT DU MOT-CLÉ "default" ICI
export default function AdSocialBar() {
  return (
    <>
      {/* Premier Script Publicitaire */}
      <Script
        id="ad-social-bar-script-1"
        src="https://pl28594689.profitablecpmratenetwork.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js"
        strategy="lazyOnload"
      />

      {/* Nouveau Script Publicitaire ajouté */}
      <Script
        id="ad-social-bar-script-2"
        src="https://pl27914784.profitablecpmratenetwork.com/fe/76/e8/fe76e8fd5162320316a889ed12f1364a.js"
        strategy="lazyOnload"
      />
    </>
  );
}
