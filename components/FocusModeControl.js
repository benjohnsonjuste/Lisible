"use client";
import React from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * Composant de contrôle du Mode Focus
 * @param {boolean} isFocusMode - État actuel du mode
 * @param {function} toggleFocus - Fonction pour basculer l'état
 */
export const FocusModeControl = ({ isFocusMode, toggleFocus }) => {
  if (isFocusMode) {
    return (
      <button
        onClick={toggleFocus}
        className="fixed top-12 right-8 z-[110] p-4 rounded-full bg-teal-600 text-white shadow-[0_0_20px_rgba(13,148,136,0.4)] hover:bg-teal-500 hover:scale-110 transition-all active:scale-95 flex items-center justify-center border border-teal-400/20"
        title="Quitter le mode focus"
      >
        <Minimize2 size={24} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleFocus}
      className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-lg hover:bg-teal-600 transition-all flex items-center justify-center group"
      title="Activer le mode focus"
    >
      <Maximize2 size={20} className="group-hover:scale-110 transition-transform" />
    </button>
  );
};

export default FocusModeControl;
