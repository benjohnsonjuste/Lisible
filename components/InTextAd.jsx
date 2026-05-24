"use client";

import React, { useEffect, useRef } from "react";

export default function InTextAd({ index = 0 }) {
  const adContainerRef = useRef(null);
  const scriptInjectedRef = useRef(false);

  useEffect(() => {
    if (scriptInjectedRef.current) return;

    // ID UNIQUE pour éviter les conflits entre plusieurs pubs
    const containerId = `container-874a186feecd3e968c16a58bb085fd56-${index}`;

    const existingContainer = document.getElementById(containerId);

    if (existingContainer && adContainerRef.current) {
      const script = document.createElement("script");

      script.async = true;
      script.setAttribute("data-cfasync", "false");

      script.src =
        "https://pl28554024.effectivecpmnetwork.com/874a186feecd3e968c16a58bb085fd56/invoke.js";

      adContainerRef.current.appendChild(script);

      scriptInjectedRef.current = true;
    }

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = "";
      }

      scriptInjectedRef.current = false;
    };
  }, [index]);

  return (
    <div className="w-full my-10 flex flex-col items-center justify-center clear-both">
      {/* Label sponsorisé */}
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">
        Sponsorisé
      </span>

      {/* Conteneur publicitaire */}
      <div
        ref={adContainerRef}
        id={`container-874a186feecd3e968c16a58bb085fd56-${index}`}
        className="
          w-full
          min-h-[180px]
          rounded-3xl
          overflow-hidden
          border
          border-slate-200/60
          bg-white/70
          backdrop-blur-sm
          shadow-xl
          flex
          items-center
          justify-center
          transition-all
          duration-300
          hover:shadow-2xl
        "
      />
    </div>
  );
}