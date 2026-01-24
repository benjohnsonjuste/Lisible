"use client";
import Contact from "@/components/Contact";
import { MessageSquareText, ShieldCheck, Zap } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* En-tête de la page */}
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic">
          On discute ?
        </h1>
        <p className="text-slate-500 font-medium max-w-xl mx-auto">
          Que vous soyez un auteur avec une question technique ou un lecteur passionné, 
          notre équipe est là pour vous répondre.
        </p>
      </header>

      {/* Ton composant avec les icônes WhatsApp, Messenger, Email */}
      <Contact />

      {/* Section de réassurance (Petits plus) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-lisible p-6 flex flex-col items-center text-center space-y-3 bg-white/50 border-none shadow-sm">
          <div className="text-teal-500 bg-teal-50 p-3 rounded-2xl">
            <Zap size={24} />
          </div>
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Rapidité</h3>
          <p className="text-xs text-slate-500 font-medium">Réponse en moins de 24h garantie.</p>
        </div>

        <div className="card-lisible p-6 flex flex-col items-center text-center space-y-3 bg-white/50 border-none shadow-sm">
          <div className="text-teal-500 bg-teal-50 p-3 rounded-2xl">
            <MessageSquareText size={24} />
          </div>
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Écoute</h3>
          <p className="text-xs text-slate-500 font-medium">Opérateurs humains, pas de robots.</p>
        </div>

        <div className="card-lisible p-6 flex flex-col items-center text-center space-y-3 bg-white/50 border-none shadow-sm">
          <div className="text-teal-500 bg-teal-50 p-3 rounded-2xl">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">Sécurité</h3>
          <p className="text-xs text-slate-500 font-medium">Vos échanges restent confidentiels.</p>
        </div>
      </div>

      {/* Footer informatif */}
      <footer className="text-center pt-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Lisible par La Belle Littéraire • Haïti
        </p>
      </footer>
    </div>
  );
}
