"use client";
import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, Scale, Mail, Facebook, 
  ArrowLeft, Coins, Zap, Star, Landmark, ShieldAlert 
} from "lucide-react";

export default function Conditions() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-16 px-6 animate-in fade-in duration-700">
      {/* Header de la page */}
      <header className="text-center space-y-4">
        <div className="inline-flex p-5 bg-slate-900 text-teal-400 rounded-[2rem] mb-2 shadow-xl">
          <Scale size={44} />
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">
          Conditions d’utilisation
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600">
          Mise à jour : Janvier 2026 • Système Financier v2
        </p>
      </header>

      <article className="bg-white rounded-[3.5rem] p-8 md:p-16 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        <div className="space-y-12 text-slate-600 leading-relaxed relative z-10">
          
          <p className="text-lg font-medium text-slate-800 border-l-8 border-teal-500 pl-8 py-2 italic bg-slate-50 rounded-r-3xl">
            Bienvenue sur <span className="text-teal-600 font-black">Lisible.biz</span>, plateforme produite par le label littéraire <span className="font-bold">La Belle Littéraire</span>, structure légale reconnue par l'État haïtien.
          </p>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
              <span className="bg-teal-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">01</span> 
              Monétisation & Économie du Li
            </h2>
            <div className="space-y-4">
              <p>
                Lisible permet aux auteurs de monétiser leur talent via le <strong>Li</strong>. Chaque lecture certifiée par notre système crédite le portefeuille de l'auteur.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-teal-50 rounded-2xl border border-teal-100 flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase text-teal-600 tracking-widest">Valeur de conversion</span>
                  <span className="text-xl font-black text-slate-900">1 000 Li = 0.20 USD</span>
                </div>
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col gap-2 text-white">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Seuil de versement</span>
                  <span className="text-xl font-black text-teal-400">25 000 Li (5.00 USD)</span>
                </div>
              </div>
              <p className="text-sm italic font-medium">
                Note : L'accès aux retraits nécessite d'avoir atteint un minimum de <strong>250 abonnés</strong>.
              </p>
            </div>
          </section>

          <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">02</span> 
              Confidentialité & Données
            </h2>
            <p className="text-sm">
              Les données collectées (nom, email, informations de profil, coordonnées de paiement) sont utilisées exclusivement par <strong>La Belle Littéraire</strong> pour faciliter la navigation et assurer les versements. Vos informations ne sont jamais partagées à des fins commerciales tierces.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
              <span className="bg-teal-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">03</span> 
              Droits d’auteur
            </h2>
            <p className="text-sm">
              Chaque auteur conserve <strong>l'intégralité de la propriété intellectuelle</strong> sur ses œuvres. En publiant sur Lisible, vous nous accordez uniquement le droit non-exclusif de diffuser votre œuvre sur la plateforme pour permettre sa lecture et sa monétisation à votre profit.
            </p>
          </section>

          <section className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
            <h2 className="flex items-center gap-3 text-xl font-black text-rose-600 mb-4 uppercase tracking-wider">
              <ShieldAlert size={24} /> 04. Clause Anti-Fraude
            </h2>
            <p className="text-sm text-rose-950/70 font-medium">
              Toute manipulation artificielle des statistiques (usage de robots, fermes à clics, auto-lectures répétitives) entraînera le <strong>blocage immédiat du compte</strong> et l'annulation définitive du solde Li accumulé.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">05</span> 
              Contact & Support
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <a href="mailto:cmo.lablitteraire7@gmail.com" className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl font-black text-[10px] uppercase tracking-widest flex-1 hover:shadow-xl transition-all group">
                <span className="flex items-center gap-3"><Mail className="text-teal-600" /> Support Team (CMO)</span>
                <ArrowLeft className="rotate-180 text-slate-300 group-hover:text-teal-500 transition-transform" size={16} />
              </a>
              <a href="https://www.facebook.com/labellelitteraire" target="_blank" className="flex items-center justify-between p-6 bg-blue-50/30 border border-blue-100 rounded-3xl font-black text-[10px] uppercase tracking-widest flex-1 hover:bg-blue-50 transition-all group">
                <span className="flex items-center gap-3 text-blue-700"><Facebook /> La Belle Littéraire</span>
                <ArrowLeft className="rotate-180 text-blue-300 group-hover:text-blue-500 transition-transform" size={16} />
              </a>
            </div>
          </section>

        </div>
      </article>

      {/* Boutons d'action */}
      <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Link href="/signup" className="px-10 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-2xl active:scale-95">
          M'INSCRIRE ET PUBLIER
        </Link>
        <Link href="/" className="flex items-center gap-2 px-8 py-5 bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] border border-slate-100 hover:text-slate-900 transition-all">
          <ArrowLeft size={16} /> Accueil
        </Link>
      </footer>
    </div>
  );
}
