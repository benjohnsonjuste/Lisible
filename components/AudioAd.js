"use client";

import React from "react";
import AdBanner, { useAdPlacements } from "./AdBanner";

/**
 * Encart publicitaire du lecteur podcast.
 *
 * Remplace l'ancien tag Monetag (zone 11101873, format notification : il
 * n'affiche que des popups "Download is ready" et ne remplit jamais un
 * encart inline) par une vraie bannière Adsterra, discrète, qui se replie
 * automatiquement si elle reste vide.
 */
const AudioAd = () => {
  const placements = useAdPlacements("box");

  return (
    <div className="w-full flex flex-col items-center my-6 clear-both">
      {placements && <AdBanner placement={placements[0]} />}
    </div>
  );
};

export default AudioAd;
