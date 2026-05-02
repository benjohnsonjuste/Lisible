"use client";

import { Share2, AlertTriangle } from "lucide-react";

export default function FloatingActions({ 
  isFocusMode, 
  handleShare, 
  onReport 
}) {
  return (
    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-slate-950 p-2.5 rounded-[2.5rem] shadow-2xl border border-white/10 ring-8 ring-slate-950/5 transition-all duration-500 ${isFocusMode ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
        
        {/* SHARE */}
        <button 
          onClick={handleShare} 
          className="p-5 text-white hover:text-blue-400 rounded-full transition-all active:scale-90"
          title="Partager"
        >
          <Share2 size={22} />
        </button>
        
        <div className="w-px h-8 bg-white/10 mx-1" />
        
        {/* REPORT */}
        <button 
          onClick={onReport} 
          className="p-5 text-slate-500 hover:text-rose-500 rounded-full transition-all"
          title="Signaler"
        >
          <AlertTriangle size={22} />
        </button>
    </div>
  );
}
