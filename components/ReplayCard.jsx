"use client";
import { PlayCircle, MessageSquare, Mic, Video, Calendar } from "lucide-react";
import Link from "next/link";

export default function ReplayCard({ replay }) {
  const date = replay.endedAt 
    ? new Date(replay.endedAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : "Date inconnue";

  // Calcul dynamique des statistiques depuis le transcript
  const commentCount = replay.transcript ? replay.transcript.length : 0;

  return (
    <Link href={`/club/replay/${replay.roomID}`}>
      <div className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-5 hover:bg-slate-900 hover:border-blue-500/30 transition-all cursor-pointer">
        {/* Thumbnail Placeholder */}
        <div className="relative aspect-video rounded-[1.5rem] mb-5 overflow-hidden bg-black flex items-center justify-center border border-white/5">
          {replay.type === 'video' ? (
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent z-10" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black z-10" />
          )}
          
          <div className="relative z-20 text-blue-500/40 group-hover:text-blue-500 transition-colors">
            {replay.type === 'video' ? <Video size={40} /> : <Mic size={40} />}
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-30">
             <div className="bg-white text-black p-4 rounded-full scale-75 group-hover:scale-100 transition-transform duration-300 shadow-2xl">
                <PlayCircle size={32} fill="currentColor" />
             </div>
          </div>
          
          {/* Badge de Type */}
          <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
            <span className="text-[8px] font-black text-white uppercase tracking-widest">{replay.type}</span>
          </div>
        </div>

        {/* Content */}
        <h4 className="text-white font-black italic tracking-tight mb-3 line-clamp-1 group-hover:text-blue-400 transition-colors">
          {replay.title}
        </h4>
        
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md">
              <MessageSquare size={12} className="text-blue-500"/> {commentCount}
            </span>
          </div>
          <span className="flex items-center gap-1.5 opacity-60">
            <Calendar size={12}/> {date}
          </span>
        </div>
      </div>
    </Link>
  );
}
