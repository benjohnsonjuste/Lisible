"use client";
import { Mic, Video, Calendar, Bell } from "lucide-react";

export default function LisibleClubClosed() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 rotate-12">
          <Video size={40} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-teal-50 rounded-[1.5rem] flex items-center justify-center text-teal-600 -rotate-12 border-4 border-white">
          <Mic size={24} />
        </div>
      </div>

      <h2 className="text-3xl font-black text-slate-900 mb-4 italic tracking-tighter">
        Le Club est fermé
      </h2>
      
      <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">
        Aucune plume n'est en direct pour le moment. Revenez plus tard ou surveillez vos notifications !
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <Calendar className="text-teal-500 mb-2" size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prochains RDV</span>
          <p className="text-xs font-bold text-slate-700 mt-1">Bientôt disponibles</p>
        </div>
        
        <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center">
          <Bell className="text-teal-400 mb-2" size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alerte Live</span>
          <p className="text-xs font-bold mt-1">Notifications actives</p>
        </div>
      </div>
    </div>
  );
}
