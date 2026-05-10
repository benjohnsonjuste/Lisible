"use client";
import React from "react";
import Link from "next/link";
import { 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  BookOpen, 
  Globe, 
  ShieldCheck,
  Zap,
  Star
} from "lucide-react";

export default function ArenaPage() {
  const concours = [
    {
      id: "battle",
      title: "Battle Poétique",
      subtitle: "International",
      description: "L'arène sacrée où le verbe se fait flamme. Un affrontement poétique mondial pour les maîtres de la rime et du rythme.",
      href: "/battle",
      icon: <Flame className="text-orange-500" size={32} />,
      status: "Saison 2 terminée",
      color: "from-orange-500/10 to-amber-500/10",
      border: "border-orange-100",
      label: "Poésie"
    },
    {
      id: "novel",
      title: "Duel des Nouvelles",
      subtitle: "International",
      description: "Le sanctuaire de la narration brève. Des duels d'imagination où chaque mot compte pour captiver le jury.",
      href: "/novel",
      icon: <BookOpen className="text-teal-500" size={32} />,
      status: "Saison 1 en cours",
      color: "from-teal-500/10 to-emerald-500/10",
      border: "border-teal-100",
      label: "Prose"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF9] font-sans pb-32 overflow-x-hidden">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto px-6 pt-24 md:pt-32">
        <header className="relative space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">
            <Trophy size={16} className="text-amber-400" /> Galerie des Prix Internationaux
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-end">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-slate-900 leading-[0.8]">
                L'Arena <br />
                <span className="text-teal-600">Lisible.</span>
              </h1>
              <p className="text-slate-500 font-medium max-w-lg leading-relaxed text-lg">
                La plateforme de streaming littéraire Lisible, propulsée par le label La Belle Littéraire, 
                devient le théâtre des plus grands prix internationaux. Découvrez nos galeries de compétitions.
              </p>
            </div>
            
            <div className="hidden md:flex justify-end">
              <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-xl max-w-xs rotate-3">
                <ShieldCheck size={40} className="text-teal-600 mb-4" />
                <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-400 mb-2">Hébergement Certifié</h4>
                <p className="text-xs font-bold text-slate-800 italic">Tous les évènements sont régis par les protocoles de transparence de La Belle Littéraire.</p>
              </div>
            </div>
          </div>
        </header>

        <hr className="my-20 border-slate-100" />

        {/* GALLERIES SECTION */}
        <section className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <Zap className="text-teal-600" /> Concours Actifs
            </h2>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{concours.length} Évènements</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {concours.map((item) => (
              <Link key={item.id} href={item.href} className="group">
                <div className={`relative h-full bg-gradient-to-br ${item.color} ${item.border} border-2 rounded-[3.5rem] p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-slate-200 overflow-hidden`}>
                  
                  {/* Decorative element */}
                  <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Trophy size={200} />
                  </div>

                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div className="p-4 bg-white rounded-3xl shadow-sm">
                        {item.icon}
                      </div>
                      <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 border border-white">
                        {item.label}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black text-teal-600 uppercase tracking-widest">{item.subtitle}</span>
                        <div className="h-px w-8 bg-teal-200" />
                      </div>
                      <h3 className="text-4xl md:text-5xl font-black italic text-slate-900 group-hover:text-teal-700 transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-slate-600 font-medium leading-relaxed italic">
                      "{item.description}"
                    </p>

                    <div className="flex items-center justify-between pt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl group-hover:bg-teal-600 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest">Entrer</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* LOGO LABEL */}
        <footer className="mt-40 flex flex-col items-center space-y-6">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="h-px w-12 bg-slate-100" />
            <Globe size={20} />
            <div className="h-px w-12 bg-slate-100" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-2">Hébergé par Lisible</p>
            <p className="text-sm font-black italic text-slate-900">
              Une plateforme du label <span className="text-teal-600">La Belle Littéraire</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
