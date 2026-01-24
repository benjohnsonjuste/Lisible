"use client";
import EventClosed from "@/components/EventClosed";
import { CalendarDays, Sparkles, Trophy } from "lucide-react";

export default function EvenementsPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* En-tête stylisé */}
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-[1.5rem] mb-2 shadow-sm">
          <CalendarDays size={40} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic">
          Événements
        </h1>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          Concours littéraires, ateliers d'écriture et rencontres. 
          Participez et faites rayonner votre plume.
        </p>
      </header>

      {/* Zone du composant principal (Affiche l'état fermé ou la liste) */}
      <section className="max-w-4xl mx-auto">
        <EventClosed />
      </section>

      {/* Section Teasing / Avantages (pour remplir l'espace proprement) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="card-lisible p-8 bg-white border-none shadow-sm flex items-start gap-5">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl shrink-0">
            <Trophy size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Concours Lisible</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Des défis thématiques pour remporter des badges exclusifs et booster votre visibilité sur la bibliothèque.
            </p>
          </div>
        </div>

        <div className="card-lisible p-8 bg-white border-none shadow-sm flex items-start gap-5">
          <div className="p-3 bg-teal-50 text-teal-500 rounded-2xl shrink-0">
            <Sparkles size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Ateliers Live</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Prochainement : des sessions d'échange avec des auteurs confirmés pour perfectionner votre style.
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center pt-6">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Restez connectés • De nouvelles annonces arrivent bientôt
        </p>
      </footer>
    </div>
  );
}
