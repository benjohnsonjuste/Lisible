"use client";
import React, { useState } from "react";
import { Player } from "@livepeer/react";
import { 
  Play, Pause, Volume2, Mic, 
  Video, headphones, Download, 
  Share2, Award, Clock 
} from "lucide-react";

export default function EpisodePlayer({ playbackId, title, author, duration, date }) {
  const [isAudioOnly, setIsAudioOnly] = useState(false);

  return (
    <div className="max-w-4xl mx-auto my-12">
      <div className="bg-[#121214] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
        
        {/* Header de l'épisode */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full w-fit">
              <Mic size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">Podcast Officiel</span>
            </div>
            <h2 className="text-3xl font-black italic text-white tracking-tighter">{title}</h2>
            <p className="text-slate-400 text-sm font-medium">avec <span className="text-white">{author}</span></p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAudioOnly(!isAudioOnly)}
              className={`p-3 rounded-2xl transition-all border ${isAudioOnly ? 'bg-teal-500 text-black border-teal-500' : 'bg-white/5 text-slate-400 border-white/10'}`}
              title={isAudioOnly ? "Passer en mode Vidéo" : "Passer en mode Audio uniquement"}
            >
              {isAudioOnly ? <headphones size={20} /> : <Video size={20} />}
            </button>
          </div>
        </div>

        {/* Zone de lecture */}
        <div className={`relative transition-all duration-700 ${isAudioOnly ? 'h-32 bg-gradient-to-r from-teal-900/20 to-slate-900' : 'aspect-video bg-black'}`}>
          {isAudioOnly ? (
            /* Visualiseur Audio minimaliste */
            <div className="absolute inset-0 flex items-center justify-center gap-1 px-10">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-teal-500/40 rounded-full animate-pulse" 
                  style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.1}s` }} 
                />
              ))}
            </div>
          ) : (
            /* Lecteur Vidéo Livepeer */
            <Player
              playbackId={playbackId}
              autoPlay={false}
              loop
              showTitle={false}
              aspectRatio="16to9"
              controls={{ autohide: 3000, poster: "" }}
              theme={{
                accentColor: "#0ea5e9",
                borderRadius: "0px",
              }}
            />
          )}
        </div>

        {/* Barre d'infos basse */}
        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{duration || "45:00"}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Award size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Saison 1</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button className="p-4 text-slate-400 hover:text-white transition-colors">
               <Download size={20} />
             </button>
             <button className="p-4 text-slate-400 hover:text-white transition-colors">
               <Share2 size={20} />
             </button>
             <button className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-400 transition-all">
               S'abonner
             </button>
          </div>
        </div>
      </div>

      {/* Description de l'épisode */}
      <div className="mt-8 px-4">
        <p className="text-slate-400 leading-relaxed text-sm">
          Dans cet épisode exclusif enregistré au studio <span className="text-white font-bold italic">Lisible</span>, 
          nous explorons les coulisses de la création littéraire à l'ère du numérique. {author} nous partage ses secrets d'écriture 
          et sa vision du futur pour les auteurs indépendants.
        </p>
      </div>
    </div>
  );
}
