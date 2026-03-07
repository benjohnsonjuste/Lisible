import React from 'react';
import { BadgeCheck } from 'lucide-react';

const CertifiedBadge = ({ certifiedCount, isCertified }) => {
  // Le badge ne s'affiche que si le contenu est officiellement certifié
  if (!isCertified && (!certifiedCount || certifiedCount <= 0)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-4 py-2 rounded-2xl w-fit backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="relative">
        <BadgeCheck className="text-indigo-600 w-5 h-5" />
        {/* L'animation de pulsation souligne l'authenticité en temps réel */}
        <span className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20"></span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter leading-none">
            Contenu Certifié
          </span>
          {certifiedCount > 1 && (
            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">
              {certifiedCount}
            </span>
          )}
        </div>
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">
          Vérifié par Lisible
        </span>
      </div>
    </div>
  );
};

export default CertifiedBadge;
