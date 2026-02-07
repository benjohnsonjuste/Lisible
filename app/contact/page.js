// app/contact/page.js
import React from "react";
import Contact from "@/components/Contact";
import { MessageSquareText, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "Contact | Lisible",
  description: "Contactez l'équipe de Lisible pour vos questions techniques ou littéraires.",
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 px-4 pt-10">
      {/* En-tête de la page */}
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter italic">
          On discute ?
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
          Que vous soyez un auteur avec une question technique ou un lecteur passionné, 
          notre équipe est là pour vous répondre.
        </p>
      </header>

      {/* Ton composant avec les icônes WhatsApp, Messenger, Email */}
      <Contact />

      {/* Section de réassurance (Petits plus) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 flex flex-col items-center text-center space-y-3 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm backdrop-blur-sm">
          <div className="text-teal-500 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <Zap size={24} />
          </div>
          <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-200">Rapidité</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Réponse en moins de 24h garantie.</p>
        </div>

        <div className="p-6 flex flex-col items-center text-center space-y-3 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm backdrop-blur-sm">
          <div className="text-teal-500 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <MessageSquareText size={24} />
          </div>
          <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-200">Écoute</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Opérateurs humains, pas de robots.</p>
        </div>

        <div className="p-6 flex flex-col items-center text-center space-y-3 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2rem] shadow-sm backdrop-blur-sm">
          <div className="text-teal-500 bg-teal-50 dark:bg-teal-900/20 p-3 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-slate-200">Sécurité</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Vos échanges restent confidentiels.</p>
        </div>
      </div>

      {/* Footer informatif */}
      <footer className="text-center pt-10 pb-12">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">
          Lisible par La Belle Littéraire • Haïti
        </p>
      </footer>
    </div>
  );
}
