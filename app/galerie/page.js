"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import TransitionVers3D from "@/components/TransitionVers3D";

const GalerieVirtuelle = dynamic(() => import("@/components/GalerieVirtuelle"), {
  ssr: false,
});

export default function GaleriePage() {
  const [isReady, setIsReady] = useState(false);

  return (
    <main className="w-full h-screen bg-black overflow-hidden">
      {!isReady ? (
        <TransitionVers3D onComplete={() => setIsReady(true)} />
      ) : (
        <div className="animate-in fade-in zoom-in duration-1000">
           <GalerieVirtuelle />
        </div>
      )}
    </main>
  );
}
