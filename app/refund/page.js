// app/refund/page.js
import React from 'react';

export const metadata = {
  title: "Politique de Remboursement | Lisible",
  description: "Conditions de remboursement et d'annulation sur la plateforme Lisible.",
};

export default function RefundPage() {
  const supportEmail = "cmo.lablitteraire7@gmail.com";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[3rem] p-8 md:p-12 border border-slate-100 dark:border-white/5">
        
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 italic tracking-tighter leading-tight">
            Politique de <span className="text-teal-600 dark:text-teal-400">Remboursement</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Mise à jour : 2 Février 2026
          </p>
        </header>

        <div className="space-y-10 text-slate-700 dark:text-slate-300">
          <section>
            <p className="leading-relaxed text-lg font-medium dark:text-slate-200">
              Chez <span className="font-black italic">Lisible</span>, nous valorisons la création littéraire et la transparence. En raison de la nature numérique de nos services, les conditions suivantes s'appliquent :
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center uppercase tracking-wider">
              <span className="bg-teal-500 text-white rounded-xl h-8 w-8 flex items-center justify-center mr-4 text-xs shadow-lg shadow-teal-500/20">1</span>
              Produits Numériques & Points Li
            </h2>
            <div className="md:pl-12 space-y-4 text-sm leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white italic">Contenu numérique :</strong> Tout achat d'accès à un texte ou un livre numérique est considéré comme consommé dès l'accès au contenu. Aucun remboursement n'est possible après consultation.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-white italic">Points Li :</strong> Les "Points Li" sont une monnaie virtuelle interne. Ils ne sont pas remboursables et ne peuvent être convertis en monnaie fiduciaire (Cash-out), sauf conditions exceptionnelles liées à des événements spécifiques.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center uppercase tracking-wider">
              <span className="bg-teal-500 text-white rounded-xl h-8 w-8 flex items-center justify-center mr-4 text-xs shadow-lg shadow-teal-500/20">2</span>
              Abonnements Premium
            </h2>
            <div className="md:pl-12">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span>Annulation possible à tout moment via vos paramètres de profil.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span>L'accès reste actif jusqu'à la fin de la période de facturation en cours.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span>Aucun remboursement partiel pour les mois non utilisés.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-50 dark:bg-white/5 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 italic">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-3">Exceptions & Erreurs</h2>
            <p className="text-sm mb-4 opacity-80">Nous étudions les demandes au cas par cas pour :</p>
            <ul className="text-xs space-y-2 opacity-70 font-medium">
              <li>• Double facturation accidentelle.</li>
              <li>• Problème technique majeur empêchant l'accès prolongé.</li>
              <li>• Non-réception des Points Li après confirmation de paiement.</li>
            </ul>
          </section>

          <section className="bg-teal-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-teal-500/20">
            <h2 className="text-xl font-black mb-4 uppercase tracking-wider flex items-center">
              <span className="bg-white text-teal-600 rounded-lg h-8 w-8 flex items-center justify-center mr-4 text-xs">4</span>
              Réclamation
            </h2>
            <div className="md:pl-12">
              <p className="text-sm mb-6 font-medium opacity-90">
                Contactez-nous sous 7 jours ouvrables après la transaction :
              </p>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl">
                <p className="text-sm font-bold tracking-tight">Email : {supportEmail}</p>
                <p className="text-[10px] uppercase font-black tracking-widest mt-1 opacity-70 italic">Objet : Réclamation Paiement - [Nom Complet]</p>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} Lisible par La Belle Littéraire
          </p>
        </footer>
      </div>
    </div>
  );
}
