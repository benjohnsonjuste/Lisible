"use client";

import Script from 'next/script';

export default function AdSocialBar() {
  return (
    <Script
      id="ad-social-bar-script"
      src="https://pl28594689.profitablecpmratenetwork.com/62/bc/8f/62bc8f4d06d16b0f6d6297a4e94cfdfd.js"
      strategy="afterInteractive" // Charge après que la page soit interactive
    />
  );
}