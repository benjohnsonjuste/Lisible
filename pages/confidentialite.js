"use client";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, Database, Mail, Facebook, ArrowLeft, Fingerprint } from "lucide-react";

export default function Confidentialite() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header de la page */}
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-[1.5rem] mb-2">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">
          Politique de Confidentialité
        </h1>
        <p className="text-slate-400 font-medium italic">Dernière mise à jour : Janvier 2026</p>
      </header>

      <article className="bg-white p-8 md:p-12 rounded-[3rem] prose prose-slate max-w-none border border-slate-50 shadow-2xl shadow-slate-200/50">
        <div className="space-y-10 text-slate-600 leading-relaxed">
          
          <p className="text-lg font-medium text-slate-800 border-l-4 border-teal-500 pl-6 py-2">
            Chez <span className="text-teal-600 font-black">Lisible</span>, la protection de vos données personnelles est une priorité. Cette page détaille comment nous traitons vos informations avec la plus grande transparence.
          </p>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500 text-sm"><Fingerprint size={24} /></span> 01. Collecte des données
            </h2>
            <p>
              Nous collectons uniquement les informations nécessaires au bon fonctionnement de votre expérience littéraire :
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                <Database size={18} className="text-teal-600 shrink-0 mt-1" />
                <span className="text-sm font-semibold text-slate-700">Identité : Nom, pseudonyme (nom de plume) et adresse email.</span>
              </li>
              <li className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl">
                <Eye size={18} className="text-teal-600 shrink-0 mt-1" />
                <span className="text-sm font-semibold text-slate-700">Interactions : Textes publiés, commentaires, likes et abonnements.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500 text-sm"><Lock size={24} /></span> 02. Utilisation & Sécurité
            </h2>
            <p>
              Vos données servent exclusivement à :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm font-medium">
              <li>Gérer votre profil d'auteur ou de lecteur.</li>
              <li>Calculer vos statistiques de lecture (vues, likes).</li>
              <li>Vous notifier des nouveautés si vous avez activé les alertes.</li>
            </ul>
            <blockquote className="bg-teal-50 border-none rounded-2xl p-6 text-teal-800 font-bold italic mt-4">
              "Lisible ne vend, ne loue, ni ne partage jamais vos données personnelles à des régies publicitaires ou des tiers commerciaux."
            </blockquote>
          </section>

          <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <h2 className="flex items-center gap-3 text-xl font-black mb-4 uppercase tracking-wider text-teal-400">
              03. Vos Droits
            </h2>
            <p className="text-slate-300 mb-6">
              Conformément aux bonnes pratiques numériques, vous disposez d'un contrôle total sur votre compte :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Droit d'accès", "Droit de rectification", "Suppression de compte", "Portabilité des textes"].map((droit, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold uppercase tracking-widest">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  {droit}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500 text-sm"><Mail size={24} /></span> 04. Contact DPO
            </h2>
            <p className="mb-6">
              Pour toute question concernant vos données ou pour demander la suppression de votre compte, contactez notre responsable de la protection des données :
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <a href="mailto:cmo.lablitteraire7@gmail.com" className="flex items-center gap-3 p-4 bg-teal-50 text-teal-700 rounded-2xl font-bold text-sm flex-1 hover:bg-teal-100 transition-all active:scale-95">
                <Mail size={20} /> cmo.lablitteraire7@gmail.com
              </a>
              <a href="https://www.facebook.com/labellelitteraire" target="_blank" className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold text-sm flex-1 hover:bg-blue-100 transition-all active:scale-95">
                <Facebook size={20} /> Messagerie officielle
              </a>
            </div>
          </section>

        </div>
      </article>

      {/* Boutons d'action */}
      <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Link href="/" className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-teal-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
          J'accepte ces conditions
        </Link>
        <Link href="/" className="flex items-center gap-2 px-8 py-4 bg-white text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-100 hover:text-teal-600 transition-all">
          <ArrowLeft size={16} /> Retour
        </Link>
      </footer>

      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
        Lisible par La Belle Littéraire
      </p>
    </div>
  );
}
