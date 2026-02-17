"use client";
import { useState, useEffect, useCallback } from "react";
import { Timer, Trophy, Users, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function BattleArena({ duelData, currentUser }) {
  const [text, setText] = useState(""); // Texte du joueur local
  const [opponentText, setOpponentText] = useState(""); // Texte de l'adversaire (via API)
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isFinished, setIsFinished] = useState(false);
  const [spectators, setSpectators] = useState(Math.floor(Math.random() * 50) + 10);

  // Sync avec l'API toutes les 2 secondes pour voir ce que l'autre écrit
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/github-db?type=get-duel&id=${duelData.id}`);
        const data = await res.json();
        // On récupère le texte de l'autre joueur
        const otherPlayer = data.player_a.id === currentUser.id ? data.player_b : data.player_a;
        setOpponentText(otherPlayer.text);
        
        if (data.status === "finished") {
          setIsFinished(true);
          clearInterval(interval);
        }
      } catch (e) { console.error("Sync error"); }
    }, 2000);
    return () => clearInterval(interval);
  }, [duelData.id, currentUser.id, isFinished]);

  // Envoi du texte local vers la DB
  const handleTyping = (e) => {
    const val = e.target.value;
    setText(val);
    // Debounce : on n'appelle l'API que toutes les 5-10 lettres pour économiser le quota GitHub
    if (val.length % 5 === 0) {
      fetch(`/api/github-db?type=sync-battle`, {
        method: "POST",
        body: JSON.stringify({ duelId: duelData.id, playerId: currentUser.id, text: val })
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 lg:p-10 font-sans">
      
      {/* HEADER : HUD DE COMBAT */}
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center bg-slate-900/50 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={currentUser.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
            <div className="absolute -bottom-2 -right-2 bg-blue-600 p-1 rounded-lg"><Zap size={12} className="text-white"/></div>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Poète Invité</p>
            <p className="font-bold text-xl italic text-white">{currentUser.name}</p>
          </div>
        </div>

        <div className="flex flex-col items-center order-first lg:order-none w-full lg:w-auto">
          <div className="flex items-center gap-3 px-8 py-3 bg-rose-500/10 rounded-full border border-rose-500/20">
            <Timer className="text-rose-500 animate-pulse" size={24} />
            <span className="text-3xl font-black font-mono text-white">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-slate-500 mt-3">Temps restant · LIVE HAÏTI</p>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Adversaire</p>
            <p className="font-bold text-xl italic text-white">L'Opposant</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="text-emerald-500" />
          </div>
        </div>
      </div>

      {/* L'ARÈNE : DOUBLE ÉCRAN */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 mt-12 h-[65vh]">
        {/* MON ÉCRAN */}
        <div className="relative group flex flex-col">
          <div className="flex justify-between items-center mb-4 px-4">
             <span className="text-[10px] font-black tracking-widest text-blue-500/50 uppercase">Ma Stèle</span>
             <span className="text-[10px] font-mono text-slate-500">{text.split('\n').filter(l => l.length > 5).length} VERS</span>
          </div>
          <textarea 
            onChange={handleTyping}
            value={text}
            disabled={isFinished}
            className="w-full h-full bg-slate-950/80 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-10 font-serif text-2xl leading-[1.8] focus:outline-none focus:border-blue-500/30 transition-all resize-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] text-blue-50"
            placeholder="Écrivez votre destin..."
          />
        </div>

        {/* ÉCRAN ADVERSAIRE */}
        <div className="relative flex flex-col opacity-80">
          <div className="flex justify-between items-center mb-4 px-4">
             <span className="text-[10px] font-black tracking-widest text-emerald-500/50 uppercase">Stèle Adverse</span>
             <span className="text-[10px] font-mono text-slate-500">{opponentText.split('\n').filter(l => l.length > 5).length} VERS</span>
          </div>
          <div className="w-full h-full bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-10 font-serif text-2xl leading-[1.8] overflow-y-auto pointer-events-none italic text-emerald-50/50">
            {opponentText || "L'adversaire prépare sa plume..."}
          </div>
        </div>
      </div>

      {/* FOOTER : PARIS & STATS */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-gradient-to-r from-blue-600/10 via-slate-900 to-emerald-600/10 p-1 rounded-[3rem] border border-white/5">
          <div className="bg-slate-950 rounded-[2.9rem] px-8 py-5 flex flex-wrap justify-between items-center">
            <button onClick={() => toast.info("Pari de 10 Li enregistré !")} className="px-6 py-3 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Parier sur A</button>
            
            <div className="flex items-center gap-10">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Pot Total</p>
                <p className="text-xl font-black text-yellow-500">850 Li</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Spectateurs</p>
                <p className="text-xl font-black text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" /> {spectators}
                </p>
              </div>
            </div>

            <button onClick={() => toast.info("Pari de 10 Li enregistré !")} className="px-6 py-3 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Parier sur B</button>
          </div>
        </div>
      </div>

      {/* OVERLAY VICTOIRE (PEN D'OR) */}
      {isFinished && (
        <div className="fixed inset-0 bg-slate-950/95 z-[300] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
           <Trophy size={100} className="text-yellow-500 mb-8 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
           <h2 className="text-[12px] font-black uppercase tracking-[1em] text-yellow-500/50 mb-4">Duel Terminé</h2>
           <p className="text-5xl font-serif italic text-white font-black mb-10">And the winner is...</p>
           <div className="bg-white/5 border border-white/10 px-10 py-5 rounded-full">
              <span className="text-2xl font-bold text-yellow-500 tracking-tighter italic">PEN D'OR : {currentUser.name}</span>
           </div>
           <button onClick={() => window.location.reload()} className="mt-12 text-slate-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest underline underline-offset-8">Retourner à la communauté</button>
        </div>
      )}
    </div>
  );
}
