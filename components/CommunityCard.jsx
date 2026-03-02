import { Trophy, Star } from "lucide-react";

export default function CommunityCard({ user }) {
  // Le badge est présent si "Haute Classe" est dans le tableau badges de l'utilisateur
  const hasHauteClasse = user.badges?.includes("Haute Classe");

  return (
    <div className="relative p-6 bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden">
      {/* BADGE HAUTE CLASSE DYNAMIQUE */}
      {hasHauteClasse && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-300 px-4 py-1.5 rounded-bl-2xl shadow-xl flex items-center gap-2 animate-pulse">
          <Trophy size={12} className="text-slate-900" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">
            Haute Classe
          </span>
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="relative">
          <img 
            src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
            className={`w-24 h-24 rounded-full border-4 ${hasHauteClasse ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-slate-800'}`}
          />
          {hasHauteClasse && (
            <div className="absolute -bottom-2 -right-2 bg-slate-950 p-1.5 rounded-full border border-amber-500">
              <Star size={14} className="fill-amber-500 text-amber-500" />
            </div>
          )}
        </div>
        
        <h3 className="mt-4 text-white font-bold text-lg">{user.penName || user.name}</h3>
        <p className="text-slate-500 text-[10px] uppercase tracking-widest">{user.role || "Membre"}</p>
      </div>
    </div>
  );
}
