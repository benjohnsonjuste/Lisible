"use client";
import { useState, useEffect, useCallback } from "react";
import { Timer, Trophy, Users, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function BattleArena({ duelData, currentUser }) {
  const [text, setText] = useState("");
  const [opponentText, setOpponentText] = useState("");
  const [timeLeft, setTimeLeft] = useState(900);
  const [isFinished, setIsFinished] = useState(false);
  const [votesA, setVotesA] = useState(0);
  const [votesB, setVotesB] = useState(0);
  const [spectators, setSpectators] = useState(Math.floor(Math.random() * 50) + 10);

  // --- AUTOMATE TEMPOREL (HAÏTI) ---
  const checkTimeAndStatus = useCallback(() => {
    const htTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Port-au-Prince"}));
    const h = htTime.getHours();
    const m = htTime.getMinutes();
    const isSunday = htTime.getDay() === 0;

    if (isSunday && (h > 15 || (h === 15 && m >= 20))) {
      if (!isFinished) {
        setIsFinished(true);
        toast.success("Duel terminé ! Analyse des vers en cours...");
      }
    }
  }, [isFinished]);

  useEffect(() => {
    const timer = setInterval(checkTimeAndStatus, 1000);
    return () => clearInterval(timer);
  }, [checkTimeAndStatus]);

  // Sync complète (Texte + Votes + Status)
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/github-db?type=battle&id=${duelData.id}`);
        const data = await res.json();
        if (data && data.content) {
          const battle = data.content;
          const otherPlayer = battle.player_a.id === currentUser.id ? battle.player_b : battle.player_a;
          setOpponentText(otherPlayer.text || "");
          setVotesA(battle.player_a.votes || 0);
          setVotesB(battle.player_b.votes || 0);
          
          if (battle.status === "finished") {
            setIsFinished(true);
          }
        }
      } catch (e) { console.error("Sync error"); }
    }, 2000);
    return () => clearInterval(interval);
  }, [duelData.id, currentUser.id, isFinished]);

  // Envoi du texte
  const handleTyping = (e) => {
    if (isFinished) return;
    const val = e.target.value;
    setText(val);
    
    if (val.length % 5 === 0) {
      fetch(`/api/github-db`, {
        method: "POST",
        body: JSON.stringify({ 
          action: "sync-battle", 
          duelId: duelData.id, 
          playerId: currentUser.id, 
          text: val 
        })
      });
    }
  };

  // Système de Points d'Impact (Vote)
  const castVote = async (targetPlayerId) => {
    if (isFinished) return;
    toast.success("Point d'Impact envoyé ! ⚡");
    try {
      await fetch(`/api/github-db`, {
        method: "POST",
        body: JSON.stringify({ 
          action: "sync-battle", 
          duelId: duelData.id, 
          playerId: targetPlayerId, 
          vote: true 
        })
      });
    } catch (e) { console.error("Vote error"); }
  };

  const handleBet = async (choice) => {
    try {
      const res = await fetch(`/api/github-db`, {
        method: "POST",
        body: JSON.stringify({
          action: "place-bet",
          userEmail: currentUser.email,
          duelId: duelData.id,
          amount: 10,
          choice: choice
        })
      });
      const data = await res.json();
      if (data.success) toast.success(`Pari enregistré sur ${choice} !`);
      else toast.error(data.error || "Erreur lors du pari");
    } catch (e) { toast.error("Serveur indisponible"); }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 lg:p-10 font-sans">
      
      {/* HEADER : HUD DE COMBAT */}
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center bg-slate-900/50 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 shadow-2xl gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={currentUser.avatar || "/api/placeholder/100/100"} className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
            <div className="absolute -bottom-2 -right-2 bg-blue-600 p-1 rounded-lg"><Zap size={12} className="text-white"/></div>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">Poète Invité</p>
            <p className="font-bold text-xl italic text-white">{currentUser.name}</p>
          </div>
        </div>

        <div className="flex flex-col items-center order-first lg:order-none w-full lg:w-auto">
          <div className="flex items-center gap-3 px-8 py-3 bg-rose-500/10 rounded-full border border-rose-500/20">
            <Timer className={`${!isFinished && 'animate-pulse'} text-rose-500`} size={24} />
            <span className="text-3xl font-black font-mono text-white">
              {isFinished ? "00:00" : `${Math.floor(timeLeft / 60)}:00`}
            </span>
          </div>
          <p className="text-[8px] font-bold uppercase tracking-[0.5em] text-slate-500 mt-3">Statut · {isFinished ? "SESSION TERMINÉE" : "LIVE HAÏTI"}</p>
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
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Ma Stèle</span>
                <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-mono border border-blue-500/20">⚡ {votesA} IMPACTS</span>
             </div>
             <span className="text-[10px] font-mono text-slate-500">{text.split('\n').filter(l => l.length > 5).length} VERS</span>
          </div>
          <textarea 
            onChange={handleTyping}
            value={text}
            disabled={isFinished}
            className="w-full h-full bg-slate-950/80 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-10 font-serif text-2xl leading-[1.8] focus:outline-none focus:border-blue-500/30 transition-all resize-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] text-blue-50"
            placeholder={isFinished ? "Le temps est écoulé." : "Écrivez votre destin..."}
          />
        </div>

        {/* ÉCRAN ADVERSAIRE */}
        <div className="relative flex flex-col">
          <div className="flex justify-between items-center mb-4 px-4">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Stèle Adverse</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/20">⚡ {votesB} IMPACTS</span>
             </div>
             <button 
               onClick={() => castVote(duelData.player_a.id === currentUser.id ? duelData.player_b.id : duelData.player_a.id)}
               disabled={isFinished}
               className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white px-3 py-1 rounded-full transition-all uppercase font-black border border-emerald-500/20"
             >
               Voter
             </button>
          </div>
          <div className="w-full h-full bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-10 font-serif text-2xl leading-[1.8] overflow-y-auto italic text-emerald-50/50 whitespace-pre-wrap">
            {opponentText || "L'adversaire prépare sa plume..."}
          </div>
        </div>
      </div>

      {/* FOOTER : PARIS & STATS */}
      <div className="max-w-4xl mx-auto mt-12">
        <div className="bg-gradient-to-r from-blue-600/10 via-slate-900 to-emerald-600/10 p-1 rounded-[3rem] border border-white/5">
          <div className="bg-slate-950 rounded-[2.9rem] px-8 py-5 flex flex-wrap justify-between items-center">
            <button 
              onClick={() => handleBet('A')}
              disabled={isFinished}
              className="px-6 py-3 bg-blue-600 disabled:bg-slate-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
              Parier sur A
            </button>
            
            <div className="flex items-center gap-10">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Pot Total</p>
                <p className="text-xl font-black text-yellow-500">{duelData.pot_total || 0} Li</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Spectateurs</p>
                <p className="text-xl font-black text-white flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  {spectators}
                </p>
              </div>
            </div>

            <button 
              onClick={() => handleBet('B')}
              disabled={isFinished}
              className="px-6 py-3 bg-emerald-600 disabled:bg-slate-800 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
              Parier sur B
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY VICTOIRE */}
      {isFinished && (
        <div className="fixed inset-0 bg-slate-950/98 z-[300] flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
           <Trophy size={100} className="text-yellow-500 mb-8 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
           <h2 className="text-[12px] font-black uppercase tracking-[1em] text-yellow-500/50 mb-4">Duel Terminé</h2>
           <p className="text-5xl font-serif italic text-white font-black mb-10 text-center">
             {votesA >= votesB ? currentUser.name : "L'adversaire"} triomphe !
           </p>
           <div className="bg-white/5 border border-white/10 px-10 py-5 rounded-full text-center">
              <span className="text-2xl font-bold text-yellow-500 tracking-tighter italic uppercase">Pen d'Or Attribué</span>
           </div>
           <button onClick={() => window.location.href = '/'} className="mt-12 text-slate-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest underline underline-offset-8">Retourner à l'accueil</button>
        </div>
      )}
    </div>
  );
}
