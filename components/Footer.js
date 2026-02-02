// components/Footer.js
import Link from "next/link";
import { MapPin, Copyright, Heart, Phone } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white pt-20 pb-10 border-t border-slate-50 overflow-hidden">
      {/* Element de design en arrière-plan (Optionnel pour le côté High-Tech) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          
          {/* Logo / Branding */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">
              Lisible<span className="text-teal-600">.</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              Streaming Littéraire
            </p>
          </div>

          {/* Séparateur minimaliste */}
          <div className="h-10 w-[1px] bg-slate-100" />

          {/* Informations de production */}
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium">
              Une production de{" "}
              <span className="text-slate-900 font-bold hover:text-teal-600 transition-colors cursor-default">
                La Belle Littéraire
              </span>
            </p>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <MapPin size={14} className="text-teal-500" />
                <address className="not-italic text-xs font-semibold tracking-wide uppercase">
                  22 RUE A. LAZARRE, DELMAS, HAÏTI
                </address>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Phone size={14} className="text-teal-500" />
                <span className="text-xs font-semibold tracking-wide">
                  (509) 4352 4498
                </span>
              </div>
            </div>
          </div>

          {/* Copyright & Crédits */}
          <div className="pt-10 w-full border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <Copyright size={12} />
              {currentYear} Lisible — Tous droits réservés
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/terms" className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                Conditions Générales d'Utilisation (CGU)
              </Link>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <Link href="/confidentialite" className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                Confidentialité
              </Link>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <Link href="/refund" className="text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                Politique de remboursement
              </Link>
            </div>

            <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Fait avec <Heart size={12} className="text-pink-500 fill-pink-500" /> pour les mots
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
