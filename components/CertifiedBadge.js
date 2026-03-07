import React from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';

const CertifiedBadge = () => {
  return (
    <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-4 py-2 rounded-2xl w-fit backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="relative">
        <BadgeCheck className="text-indigo-600 w-5 h-5" />
        <span className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20"></span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter leading-none">
          Contenu Certifié
        </span>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">
          Vérifié par Lisible
        </span>
      </div>
    </div>
  );
};

export default CertifiedBadge;
