"use client";
import React from "react";
import { Trophy, Medal, Users, Flame, Percent } from "lucide-react";

export default function DuelResults({ duelData }) {
  const [p1, p2] = duelData.participants;
  const votesP1 = duelData.votes?.[p1] || 0;
  const votesP2 = duelData.votes?.[p2] || 0;
  const totalVotes = votesP1 + votesP2;

  // Calcul des pourcentages
  const percentP1 = totalVotes > 0 ? Math.round((votesP1 / totalVotes) * 100) : 50;
  const percentP2 = totalVotes > 0 ? Math.round((votesP2 / totalVotes) * 100) : 50;

  const isWinnerP1 = votesP1 > votesP2;
  const isWinnerP2 = votesP2 > votesP1;
  const isDraw = votesP1 === votesP2 && totalVotes > 0;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl">
      <div className="text-center mb-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 mb-2">Verdict de la Plume</h3>
        <p className="text-2xl font-serif italic text-slate-200">Récit des suffrages</p>
      </div>

      <div className="space-y-12">
        {/* JAUGE DE PROGRESSION DYNAMIQUE */}
        <div className="relative h-4 w-full bg-white/10 rounded-full overflow-hidden flex border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-1000 ease-out relative"
            style={{ width: `${percentP1}%` }}
          >
            {percentP1 > 15 && (
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-tighter">
                {percentP1}%
              </span>
            )}
          </div>
          <div 
            className="h-full bg-gradient-to-l from-teal-600 to-teal-400 transition-all duration-1000 ease-out relative"
            style={{ width: `${percentP2}%` }}
          >
            {percentP2 > 15 && (
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white uppercase tracking-tighter">
                {percentP2}%
              </span>
            )}
          </div>
        </div>

        {/* COMPARATIF DES SCORES */}
        <div className="grid grid-cols-2 gap-4 md:gap-12">
          {/* JOUEUR 1 */}
          <div className={`flex flex-col items-center p-6 rounded-[2.5rem] transition-all duration-500 ${isWinnerP1 ? 'bg-rose-500/10 border border-rose-500/30 scale-105 shadow-[0_0_40px_rgba(225,29,72,0.1)]' : 'opacity-50'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isWinnerP1 ? 'bg-rose-500 text-white animate-bounce' : 'bg-white/10 text-slate-400'}`}>
              {isWinnerP1 ? <Trophy size={30} /> : <Medal size={30} />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Auteur I</span>
            <span className="text-3xl font-mono font-black text-white">{votesP1}</span>
            <span className="text-[10px] font-bold text-rose-500 mt-2 uppercase">Suffrages</span>
          </div>

          {/* JOUEUR 2 */}
          <div className={`flex flex-col items-center p-6 rounded-[2.5rem] transition-all duration-500 ${isWinnerP2 ? 'bg-teal-500/10 border border-teal-500/30 scale-105 shadow-[0_0_40px_rgba(20,184,166,0.1)]' : 'opacity-50'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isWinnerP2 ? 'bg-teal-500 text-white animate-bounce' : 'bg-white/10 text-slate-400'}`}>
              {isWinnerP2 ? <Trophy size={30} /> : <Medal size={30} />}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Auteur II</span>
            <span className="text-3xl font-mono font-black text-white">{votesP2}</span>
            <span className="text-[10px] font-bold text-teal-500 mt-2 uppercase">Suffrages</span>
          </div>
        </div>

        {/* RÉSUMÉ TOTAL */}
        <div className="flex justify-center items-center gap-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-500">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{totalVotes} Lecteurs ont voté</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Flame size={14} className="text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Intensité Maximale</span>
          </div>
        </div>
      </div>

      {/* BANDEAU VAINQUEUR */}
      {(isWinnerP1 || isWinnerP2) && (
        <div className="mt-12 py-4 bg-white/5 rounded-2xl text-center border border-white/5 animate-pulse">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            {isWinnerP1 ? "L'Auteur I remporte la palme de ce duel" : "L'Auteur II s'impose dans l'arène"}
          </p>
        </div>
      )}
      
      {isDraw && (
        <div className="mt-12 py-4 bg-white/5 rounded-2xl text-center border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
            Égalité Parfaite : Les plumes se valent
          </p>
        </div>
      )}
    </div>
  );
}
