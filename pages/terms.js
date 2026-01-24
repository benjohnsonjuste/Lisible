"use client";
import Link from "next/link";
import { ShieldCheck, Scale, FileText, Mail, Facebook, ArrowLeft } from "lucide-react";

export default function Conditions() {
  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header de la page */}
      <header className="text-center space-y-4">
        <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-[1.5rem] mb-2">
          <Scale size={40} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight">
          Conditions d’utilisation
        </h1>
        <p className="text-slate-400 font-medium italic">Dernière mise à jour : Janvier 2026</p>
      </header>

      <article className="card-lisible prose prose-slate max-w-none border-none ring-1 ring-slate-100 shadow-xl shadow-slate-200/50">
        <div className="space-y-8 text-slate-600 leading-relaxed">
          
          <p className="text-lg font-medium text-slate-800 border-l-4 border-teal-500 pl-6 py-2">
            Bienvenue sur <span className="text-teal-600 font-black">Lisible</span>, plateforme de lecture en streaming produite par le label littéraire <span className="font-bold">La Belle Littéraire</span>, structure légale reconnue par l'État haïtien.
          </p>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500">01.</span> Objet de Lisible
            </h2>
            <p>
              Lisible permet aux lecteurs d’accéder gratuitement à un catalogue d’œuvres littéraires et aux auteurs de publier leurs textes, d’agrandir leur fanbase et de monétiser leurs œuvres à partir de <strong>250 abonnés</strong>. Lisible agit uniquement comme un intermédiaire de diffusion et ne revendique aucun droit sur les œuvres publiées.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500">02.</span> Confidentialité
            </h2>
            <p>
              Les données collectées (nom, email, informations de profil, abonnements) sont utilisées uniquement pour faciliter la navigation. Lisible ne vend ni ne partage vos informations personnelles à des tiers à des fins commerciales.
            </p>
          </section>

          <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500">03.</span> Compte Utilisateur
            </h2>
            <p className="mb-4 font-medium">Certaines fonctionnalités nécessitent un compte gratuit :</p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {["Publier un texte", "S’abonner", "Aimer un texte"].map((item, i) => (
                <li key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-xs font-black text-slate-500 shadow-sm">
                  <ShieldCheck size={14} className="text-teal-500" /> {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500">04.</span> Droits d’auteur
            </h2>
            <p>
              Chaque auteur conserve <strong>l'intégralité de ses droits</strong> sur ses œuvres. Lisible n’a aucun droit de reproduction ou redistribution sans autorisation.
            </p>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-4 uppercase tracking-wider">
              <span className="text-teal-500">05.</span> Contact & Support
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <a href="mailto:support@labellelitteraire.ht" className="flex items-center gap-3 p-4 bg-teal-50 text-teal-700 rounded-2xl font-bold text-sm flex-1 hover:bg-teal-100 transition-colors">
                <Mail size={20} /> support@labellelitteraire.ht
              </a>
              <a href="https://www.facebook.com/labellelitteraire" target="_blank" className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl font-bold text-sm flex-1 hover:bg-blue-100 transition-colors">
                <Facebook size={20} /> La Belle Littéraire
              </a>
            </div>
          </section>

        </div>
      </article>

      {/* Boutons d'action */}
      <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Link href="/signup" className="btn-lisible w-full sm:w-auto shadow-xl shadow-teal-100">
          M'INSCRIRE ET PUBLIER
        </Link>
        <Link href="/" className="flex items-center gap-2 px-8 py-4 bg-white text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-100 hover:text-teal-600 transition-all">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
      </footer>
    </div>
  );
}
