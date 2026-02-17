"use client";
import { PlayCircle, MessageSquare, Heart, Calendar } from "lucide-react";

export default function ReplayCard({ replay }) {
  const date = new Date(replay.endedAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="group bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 hover:bg-slate-900 hover:border-blue-500/30 transition-all cursor-pointer">
      <div className="relative aspect-video rounded-2xl mb-4 overflow-hidden bg-slate-950 flex items-center justify-center">
        {replay.type === 'video' ? (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        ) : (
          <div className="text-blue-500/20"><PlayCircle size={64} /></div>
        )}
        <PlayCircle className="text-white opacity-0 group-hover:opacity-100 transition-opacity z-20" size={48} />
      </div>

      <h4 className="text-white font-bold mb-2 line-clamp-1">{replay.title}</h4>
      
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><MessageSquare size={12}/> {replay.stats?.totalComments || 0}</span>
          <span className="flex items-center gap-1"><Heart size={12}/> {replay.stats?.totalReactions || 0}</span>
        </div>
        <span className="flex items-center gap-1"><Calendar size={12}/> {date}</span>
      </div>
    </div>
  );
}
