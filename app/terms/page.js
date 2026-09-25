"use client";
import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, Scale, Mail, Link2, 
  ArrowLeft, Coins, Zap, Star, Landmark, ShieldAlert, HandCoins 
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
          Mise à jour : Septembre 2026
        </p>
      </header>

      <article className="bg-white rounded-[3.5rem] p-8 md:p-16 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        <div className="space-y-12 text-slate-600 leading-relaxed relative z-10">
          
          <p className="text-lg font-medium text-slate-800 border-l-8 border-teal-500 pl-8 py-2 italic bg-slate-50 rounded-r-3xl">
            Bienvenue sur <span className="text-teal-600 font-black">Lisible</span>, plateforme de streaming littéraire produite par le label littéraire <span className="font-bold">La Belle Littéraire</span>, structure légale reconnue par l'État haïtien.
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
              Les données collectées (nom, email, informations de profil, coordonnées de paiement) sont utilisées exclusivement par <strong>La Belle Littéraire</strong> pour faciliter la navigation et assurer les versements. Vos données de compte ne sont jamais vendues ni louées à des tiers.
            </p>
            <p className="text-sm mt-3">
              Pour financer la gratuité du service, le site affiche des publicités via des régies tierces, dont <strong>Google AdSense</strong>. Ces partenaires utilisent des cookies publicitaires conformément à notre <Link href="/confidentialite" className="text-teal-600 font-bold underline underline-offset-2">Politique de Confidentialité</Link> (section « Cookies publicitaires ») et uniquement après votre consentement, que vous pouvez retirer à tout moment.
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
              <span className="bg-amber-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">05</span>
              <Coins size={24} /> Monnaie virtuelle Li & Cadeaux
            </h2>
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col gap-2 mb-6">
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Taux officiel unique</span>
              <span className="text-xl font-black text-slate-900">1 Li = 0,01 $ US — sur toute la plateforme, sans exception</span>
            </div>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Nature des Li :</strong> les Li sont des jetons d'usage internes (points utilitaires). Ils ne constituent ni une monnaie électronique, ni une cryptomonnaie, ni une réserve de valeur.</li>
              <li><strong>Achat :</strong> les lecteurs achètent des packs de Li en une seule transaction (carte bancaire, PayPal ou Interac). Les frais bancaires sont groupés sur cette transaction unique afin d'éviter les micro-frais sur chaque don.</li>
              <li><strong>Non-remboursables :</strong> une fois achetés, les Li ne peuvent pas être reconvertis en argent réel ni remboursés au lecteur (hors droit de rétractation légal applicable aux contenus numériques non consommés).</li>
              <li><strong>Cadeaux :</strong> les lecteurs offrent des cadeaux virtuels animés (Gomme, Crayon, Feuille, Encrier, Plume d'Or, Parchemin, Grimoire d'Or) aux auteurs lors des lives, des jeux en direct et au bas des textes et livres publiés. Chaque cadeau a une valeur fixe en Li.</li>
              <li><strong>Répartition :</strong> sur chaque cadeau, <strong>85 %</strong> de la valeur en Li revient à l'auteur sous forme de gains, <strong>15 %</strong> reviennent à Lisible (serveurs, flux vidéo, fonctionnement). Les frais bancaires liés aux retraits sont déduits de la part de l'auteur.</li>
              <li><strong>Retraits des auteurs :</strong> l'auteur accumule ses gains en Li et peut demander un retrait à partir de <strong>25 000 Li</strong> (250 $ US). Une <strong>réserve de 5 %</strong> est retenue temporairement sur chaque retrait pour couvrir d'éventuels litiges bancaires (chargebacks) ; elle est libérée après 60 jours sans litige.</li>
              <li><strong>Vérification d'identité (KYC) :</strong> avant tout versement en argent réel, l'auteur doit faire vérifier son identité (pièce d'identité et informations fiscales), conformément aux règles de lutte contre le blanchiment d'argent (AML). Lisible peut refuser ou suspendre un retrait en cas de doute.</li>
              <li><strong>Transferts :</strong> tout envoi de cadeau est définitif et enregistré. Les tentatives de fraude, de contournement ou de manipulation du système de cadeaux entraînent le blocage du compte et l'annulation des gains (voir clause anti-fraude).</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
              <span className="bg-teal-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">06</span>
              Espace Freelance
            </h2>
            <div className="space-y-4">
              <p>
                L'<strong>Espace Freelance</strong> permet aux écrivains de confier des missions (relecture, correction, mise en pages, couverture, traduction, etc.) à des professionnels du livre inscrits sur Lisible.
              </p>
              <div className="p-6 bg-teal-50 rounded-2xl border border-teal-100 flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase text-teal-600 tracking-widest">Commission de la plateforme</span>
                <span className="text-xl font-black text-slate-900">15 % du budget — 85 % reversés au professionnel</span>
              </div>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Séquestre :</strong> l'écrivain paie le budget de la mission via PayPal dès sa publication. Les fonds sont capturés sur le compte PayPal de la plateforme et restent <strong>bloqués</strong> jusqu'à la livraison et la validation du travail.</li>
                <li><strong>Acceptation :</strong> un professionnel accepte une mission en fixant lui-même son délai de remise. Une mission acceptée n'est plus disponible pour les autres professionnels.</li>
                <li><strong>Délais :</strong> si le délai est dépassé sans livraison, le professionnel peut demander jusqu'à <strong>2 prolongations de 1 à 7 jours</strong>, chacune soumise à l'accord de l'écrivain. Sans accord ni livraison, la mission est automatiquement rouverte aux autres professionnels et le retard est comptabilisé sur le profil du professionnel.</li>
                <li><strong>Validation :</strong> l'écrivain valide le travail reçu (avec une note facultative de 1 à 5). Sans réponse ni litige <strong>7 jours après la livraison</strong>, la validation est automatique. La validation libère le séquestre : 85 % du budget sont versés au professionnel (via PayPal, sur l'adresse déclarée dans son profil), 15 % reviennent à Lisible.</li>
                <li><strong>Révisions :</strong> l'écrivain peut demander jusqu'à <strong>3 révisions</strong> avant de valider ou d'ouvrir un litige.</li>
                <li><strong>Litiges :</strong> en cas de désaccord, l'écrivain ou le professionnel peut ouvrir un litige. Lisible tranche souverainement : remboursement de l'écrivain, paiement du professionnel, ou partage entre les deux parties.</li>
                <li><strong>Annulation :</strong> l'écrivain peut annuler une mission non démarrée ; le séquestre est alors intégralement remboursé.</li>
                <li><strong>Professionnels :</strong> chaque professionnel déclare une adresse PayPal valide où recevoir ses gains. Lisible peut vérifier ou suspendre un profil en cas d'abus.</li>
              </ul>
              <p className="text-sm italic font-medium">
                Note : en l'absence d'identifiants PayPal configurés, l'Espace Freelance fonctionne en « mode test » : aucun argent réel ne circule et les paiements sont simulés.
              </p>
            </div>
          </section>

          <section className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
              <span className="bg-amber-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">07</span>
              <HandCoins size={24} /> Coproduction participative & partage de revenus
            </h2>
            <div className="space-y-4">
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Avertissement sur les risques</span>
                <p className="text-sm font-bold text-rose-950/80 mt-2">
                  La coproduction n'est ni un placement financier garanti, ni un prêt, ni un produit d'épargne. <strong>Aucun rendement n'est promis et aucun taux d'intérêt n'est versé.</strong> Seul le chiffre d'affaires réellement encaissé sur les ventes du livre est partagé. Si le livre ne génère pas de ventes, rien n'est versé et vous pouvez perdre tout ou partie de votre mise.
                </p>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li><strong>Principe :</strong> les utilisateurs inscrits peuvent soutenir financièrement la publication d'un livre (correction, couverture, marketing) en contribuant à sa campagne depuis leur Solde Lisible (Li).</li>
                <li><strong>Frais de dossier :</strong> des frais non remboursables de <strong>2,5 %</strong> sont prélevés sur chaque contribution (traitement bancaire et gestion). Ils restent acquis à Lisible même si la campagne échoue.</li>
                <li><strong>Campagne non financée :</strong> si l'objectif n'est pas atteint à 100 % à la fin de la campagne, votre mise nette (hors frais) vous est <strong>automatiquement recréditée en Li</strong> sur votre Solde Lisible. Aucun remboursement sur carte bancaire n'est effectué : les Li recrédités peuvent être réinvestis sur d'autres projets ou utilisés pour les cadeaux.</li>
                <li><strong>Partage des revenus :</strong> pendant <strong>12 mois maximum</strong> à compter de la sortie officielle du livre, le chiffre d'affaires réellement encaissé est réparti ainsi : <strong>60 %</strong> aux coproducteurs (au prorata de leur mise nette), <strong>20 %</strong> à l'auteur dès la première vente, <strong>20 %</strong> à Lisible (gestion, suivi, plateforme).</li>
                <li><strong>Plafond :</strong> la redistribution à chaque coproducteur s'arrête dès qu'il a perçu <strong>115 %</strong> de sa mise nette, ou à l'expiration des 12 mois. Le reliquat éventuel revient à l'auteur.</li>
                <li><strong>Encaissement définitif :</strong> les revenus ne sont redistribués qu'après encaissement définitif des ventes (délai anti-annulation de 30 jours), afin d'éviter tout risque lié aux annulations de paiement.</li>
                <li><strong>Pool Lisible (Fonds des Auteurs) :</strong> vous pouvez aussi acheter des parts du Pool (25 $ CA / part). Le comité éditorial de Lisible sélectionne 3 à 5 livres par trimestre et y répartit le capital du Pool. Les gains sont redistribués aux détenteurs de parts au prorata, après des <strong>frais de gestion de 17,5 %</strong> prélevés par Lisible (sélection, accompagnement éditorial, promotion).</li>
              </ul>
              <div className="p-6 bg-slate-900 rounded-2xl text-white">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Clause de solde inactif</span>
                <p className="text-sm mt-2 text-slate-300">
                  Si votre Solde Lisible reste <strong>inutilisé pendant plus de 12 mois consécutifs</strong> sans aucune activité enregistrée (connexion, achat, contribution, retrait…), des <strong>frais de gestion de 2 $ CA par mois</strong> seront déduits de votre solde jusqu'à épuisement. Un préavis vous est envoyé au 11<sup>e</sup> mois d'inactivité. Toute activité sur votre compte interrompt le compteur d'inactivité.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-900 mb-6 uppercase tracking-wider">
              <span className="bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-[10px]">08</span> 
              Contact & Support
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <a href="mailto:cmo.lablitteraire7@gmail.com" className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl font-black text-[10px] uppercase tracking-widest flex-1 hover:shadow-xl transition-all group">
                <span className="flex items-center gap-3"><Mail className="text-teal-600" /> Lisible Support Team</span>
                <ArrowLeft className="rotate-180 text-slate-300 group-hover:text-teal-500 transition-transform" size={16} />
              </a>
              <a href="https://www.facebook.com/labellelitteraire" target="_blank" className="flex items-center justify-between p-6 bg-blue-50/30 border border-blue-100 rounded-3xl font-black text-[10px] uppercase tracking-widest flex-1 hover:bg-blue-50 transition-all group">
                <span className="flex items-center gap-3 text-blue-700"><Link2 /> La Belle Littéraire</span>
                <ArrowLeft className="rotate-180 text-blue-300 group-hover:text-blue-500 transition-transform" size={16} />
              </a>
            </div>
          </section>

        </div>
      </article>

      {/* Boutons d'action */}
      <footer className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
        <Link href="/login" className="px-10 py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-2xl active:scale-95">
          M'INSCRIRE ET PUBLIER
        </Link>
        <Link href="/" className="flex items-center gap-2 px-8 py-5 bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] border border-slate-100 hover:text-slate-900 transition-all">
          <ArrowLeft size={16} /> Accueil
        </Link>
      </footer>
    </div>
  );
}