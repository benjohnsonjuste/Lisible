"use client";
import React from "react";
import { Trophy, Medal, Users, Flame, Percent } from "lucide-react";

export default function DuelResults({ duelData }) {
  const [p1, p2] = duelData.participants;
  const nameP1 = duelData.participantNames?.[p1] || "Auteur I";
  const nameP2 = duelData.participantNames?.[p2] || "Auteur II";
  
  const votesP1 = duelData.votes?.[p1] || 0;
  const votesP2 = duelData.votes?.[p2] || 0;
  const totalVotes = votesP1 + votesP2;

  // Calcul des pourcentages pour la jauge
  const percentP1 = totalVotes > 0 ? Math.round((votesP1 / totalVotes) * 100) : 50;
  const percentP2 = totalVotes > 0 ? Math.round((votesP2 / totalVotes) * 100) : 50;

  const isWinnerP1 = votesP1 > votesP2;
  const isWinnerP2 = votesP2 > votesP1;
  const isDraw = votesP1 === votesP2 && totalVotes > 0;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl">
      <div className="text-center mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 mb-2">Verdict de la Plume</h3>
        <p className="text-2xl font-serif italic text-slate-200">Récit des suffrages exprimés</p>
      </div>

      <div className="space-y-12">
        {/* JAUGE DE PROGRESSION DYNAMIQUE BICOLORE */}
        <div className="relative h-6 w-full bg-white/10 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-rose-700 to-rose-500 transition-all duration-1000 ease-out relative flex items-center justify-center"
            style={{ width: `${percentP1}%` }}
          >
            {percentP1 > 10 && (
              <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-md">
                {percentP1}%
              </span>
            )}
          </div>
          <div 
            className="h-full bg-gradient-to-l from-teal-700 to-teal-500 transition-all duration-1000 ease-out relative flex items-center justify-center"
            style={{ width: `${percentP2}%` }}
          >
            {percentP2 > 10 && (
              <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-md">
                {percentP2}%
              </span>
            )}
          </div>
        </div>

        {/* COMPARATIF DES SCORES DÉTAILLÉ */}
        <div className="grid grid-cols-2 gap-4 md:gap-12">
          {/* JOUEUR 1 */}
          <div className={`flex flex-col items-center p-8 rounded-[2.5rem] transition-all duration-700 ${isWinnerP1 ? 'bg-rose-500/10 border border-rose-500/30 scale-105 shadow-[0_0_50px_rgba(225,29,72,0.15)]' : 'opacity-40 grayscale-[0.5]'}`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 rotate-3 transition-transform ${isWinnerP1 ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40' : 'bg-white/5 text-slate-500'}`}>
              {isWinnerP1 ? <Trophy size={36} /> : <Medal size={36} />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Plume de Gauche</span>
            <h4 className="text-white font-bold text-sm mb-3 truncate w-full text-center">{nameP1}</h4>
            <div className="flex flex-col items-center">
                <span className="text-4xl font-mono font-black text-white">{votesP1}</span>
                <span className="text-[8px] font-black text-rose-500 mt-1 uppercase tracking-widest">Votes</span>
            </div>
          </div>

          {/* JOUEUR 2 */}
          <div className={`flex flex-col items-center p-8 rounded-[2.5rem] transition-all duration-700 ${isWinnerP2 ? 'bg-teal-500/10 border border-teal-500/30 scale-105 shadow-[0_0_50px_rgba(20,184,166,0.15)]' : 'opacity-40 grayscale-[0.5]'}`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 -rotate-3 transition-transform ${isWinnerP2 ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40' : 'bg-white/5 text-slate-500'}`}>
              {isWinnerP2 ? <Trophy size={36} /> : <Medal size={36} />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Plume de Droite</span>
            <h4 className="text-white font-bold text-sm mb-3 truncate w-full text-center">{nameP2}</h4>
            <div className="flex flex-col items-center">
                <span className="text-4xl font-mono font-black text-white">{votesP2}</span>
                <span className="text-[8px] font-black text-teal-500 mt-1 uppercase tracking-widest">Votes</span>
            </div>
          </div>
        </div>

        {/* RÉSUMÉ TECHNIQUE */}
        <div className="flex justify-center items-center gap-10 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3 text-slate-500">
            <Users size={16} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{totalVotes} Lecteurs engagés</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Flame size={16} className="text-orange-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Duel Historique</span>
          </div>
        </div>
      </div>

      {/* BANDEAU DE PROCLAMATION */}
      {(isWinnerP1 || isWinnerP2) && (
        <div className="mt-12 py-5 bg-gradient-to-b from-white/5 to-transparent rounded-2xl text-center border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">
            Proclamation : {isWinnerP1 ? `${nameP1.toUpperCase()} s'impose par le verbe` : `${nameP2.toUpperCase()} triomphe dans l'Arène`}
          </p>
        </div>
      )}
      
      {isDraw && (
        <div className="mt-12 py-5 bg-amber-500/5 rounded-2xl text-center border border-amber-500/20">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">
            Égalité Parfaite : Les plumes ont trouvé leur maître respectif.
          </p>
        </div>
      )}
    </div>
  );
}
