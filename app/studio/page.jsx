"use client";
import Link from "next/link";
import { Mic2, Radio, ArrowRight, Clock, Users, Share2 } from "lucide-react";

export default function StudioHubPage() {
  return (
    <main className="min-h-screen bg-[#fcfbf9] dark:bg-slate-950 pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-600 mb-3">Espace créateur</p>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 dark:text-white">
            Studio <span className="text-teal-600">Lisible.</span>
          </h1>
          <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">
            Enregistrez vos podcasts ou passez en direct devant votre audience. Votre voix, votre antenne.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Podcast */}
          <Link href="/studio/podcast" className="group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/10 p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center mb-6">
              <Mic2 size={28} className="text-rose-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Podcast Studio</h2>
            <p className="text-sm text-slate-500 mb-6">Transformez vos écrits en récits audio. Enregistrez, réécoutez et partagez votre voix.</p>
            <span className="inline-flex items-center gap-2 text-sm font-black text-rose-600">
              Ouvrir le studio <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* Live */}
          <Link href="/studio/live" className="group relative overflow-hidden bg-slate-950 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all border border-white/10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/20 blur-[100px] rounded-full" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/15 flex items-center justify-center mb-6">
                <Radio size={28} className="text-teal-400" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-black text-white">Live Studio</h2>
                <span className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Nouveau</span>
              </div>
              <p className="text-sm text-slate-400 mb-6">Passez en direct en vidéo ou en audio, 15 minutes d'antenne, invité et lien partageable.</p>
              <ul className="space-y-2 mb-6 text-xs text-slate-500">
                <li className="flex items-center gap-2"><Share2 size={14} className="text-teal-400" /> Lien public : même sans compte, on vous voit</li>
                <li className="flex items-center gap-2"><Users size={14} className="text-teal-400" /> Invitez une plume inscrite comme invité</li>
                <li className="flex items-center gap-2"><Clock size={14} className="text-teal-400" /> 15 minutes, commentaires et cœurs éphémères</li>
              </ul>
              <span className="inline-flex items-center gap-2 text-sm font-black text-teal-400">
                Passer en direct <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
