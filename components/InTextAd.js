"use client";
import AdBanner from "./AdBanner";
import { INTEXT_MOBILE } from "./adsterraPlacements";

/**
 * Bannière publicitaire in-text — fin manteau sur AdBanner (composant générique).
 * Gardée pour compatibilité avec app/texts/[id]/TextContent.jsx.
 */
export default function InTextAd({ placement = INTEXT_MOBILE[1] }) {
  return <AdBanner placement={placement} className="my-3" />;
}
