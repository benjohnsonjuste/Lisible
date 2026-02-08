"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  ArrowLeft, Share2, Eye, Heart, Trophy, Maximize2, Minimize2, 
  Clock, AlertTriangle, Ghost, Sun, Zap, Coffee, Send, ShieldCheck
} from "lucide-react";

export default function TextPageClient({ initialText, id, allTexts }) {
  const router = useRouter();
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Calcul du temps de lecture
  const readingTime = useMemo(() => 
    Math.max(1, Math.ceil((initialText?.content?.split(/\s+/).length || 0) / 200))
  , [initialText]);

  // Barre de progression
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isFocusMode ? 'bg-[#F5F2ED]' : 'bg-[#FCFBF9]'}`}>
      <div className="fixed top-0 left-0 h-1.5 bg-teal-600 z-[100] transition-all" style={{ width: `${readingProgress}%` }} />
      
      <div className="max-w-2xl mx-auto px-6 py-10">
        <header className={`flex justify-between mb-16 ${isFocusMode ? 'opacity-0' : ''}`}>
          <button onClick={() => router.back()} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <button onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Lien copié !");
          }} className="p-4 bg-slate-900 text-white rounded-2xl">
            <Share2 size={20} />
          </button>
        </header>

        <article className="animate-in fade-in duration-1000">
          <div className="flex gap-4 mb-8">
            <span className="text-[10px] font-black bg-teal-50 text-teal-600 px-3 py-1 rounded-lg border border-teal-100 flex items-center gap-2">
              <Clock size={12} /> {readingTime} MIN
            </span>
          </div>

          <h1 className={`font-serif font-black italic mb-10 transition-all ${isFocusMode ? 'text-7xl' : 'text-5xl text-slate-900'}`}>
            {initialText.title}
          </h1>

          <div className={`prose max-w-none font-serif leading-relaxed mb-20 whitespace-pre-wrap ${isFocusMode ? 'text-2xl' : 'text-xl text-slate-800'}`}>
            {initialText.content}
          </div>
        </article>

        <button 
          onClick={() => setIsFocusMode(!isFocusMode)} 
          className="fixed bottom-10 right-10 p-5 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-all"
        >
          {isFocusMode ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
        </button>
      </div>
    </div>
  );
}
