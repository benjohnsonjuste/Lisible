import React from 'react';
import Head from 'next/head';

const RefundPolicy = () => {
  const supportEmail = "cmo.lablitteraire7@gmail.com"; // Remplace par ton vrai email

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Politique de Remboursement | Lisible</title>
        <meta name="description" content="Conditions de remboursement et d'annulation sur la plateforme Lisible." />
      </Head>

      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Politique de Remboursement
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : 2 février 2026
        </p>

        <div className="prose prose-blue text-gray-700 space-y-8">
          <section>
            <p className="leading-relaxed">
              Chez <span className="font-semibold text-blue-600">Lisible</span>, nous valorisons la création littéraire et la transparence envers nos utilisateurs. En raison de la nature numérique de nos services, les conditions de remboursement suivantes s'appliquent :
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-sm">1</span>
              Produits Numériques et "Points Li"
            </h2>
            <div className="pl-11">
              <p className="mb-2">
                <strong>Contenu numérique :</strong> Tout achat d'accès à un texte un livre numérique et d'autres services numériques diffusés directement sur la plateforme est considéré comme "consommé" dès l'accès au contenu. Aucun remboursement ne sera accordé une fois le texte consulté.
              </p>
              <p>
                <strong>Points Li :</strong> Les "Points Li" achetés sur la plateforme ne sont pas remboursables. Ils constituent une monnaie virtuelle interne destinée à l'interaction sur le site et ne peuvent être convertis en monnaie fiduciaire (Cash-out), sauf mention contraire lors d'événements spécifiques.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-sm">2</span>
              Abonnements (Premium)
            </h2>
            <div className="pl-11">
              <ul className="list-disc space-y-2">
                <li>Si vous avez souscrit à un abonnement mensuel ou annuel, vous pouvez l'annuler à tout moment depuis vos paramètres de profil.</li>
                <li>L'annulation prendra effet à la fin de la période de facturation en cours. Vous conserverez vos accès jusqu'à cette date.</li>
                <li>Les remboursements partiels pour les mois non utilisés ne sont pas autorisés.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-sm">3</span>
              Exceptions et Erreurs de Facturation
            </h2>
            <div className="pl-11 italic text-gray-600">
              <p className="mb-2">Nous examinerons les demandes de remboursement au cas par cas dans les situations suivantes :</p>
              <ul className="list-dash space-y-1 ml-4">
                <li>• Double facturation accidentelle pour la même transaction.</li>
                <li>• Problème technique majeur empêchant l'accès au service de manière prolongée, dû exclusivement à notre plateforme.</li>
                <li>• Non-réception des "Points Li" après confirmation du paiement par nos partenaires. </li>
              </ul>
            </div>
          </section>

          <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center mr-3 text-sm">4</span>
              Procédure de Réclamation
            </h2>
            <div className="pl-11 text-sm">
              <p className="mb-4">Pour toute réclamation, vous devez nous contacter dans un délai de <strong>7 jours ouvrables</strong> suivant la transaction :</p>
              <div className="bg-white p-4 rounded border border-blue-200 inline-block shadow-sm">
                <p><strong>Email :</strong> <a href={`mailto:${supportEmail}`} className="text-blue-600 underline">{supportEmail}</a></p>
                <p><strong>Objet :</strong> Réclamation Paiement - [Votre nom complet]</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} Lisible - Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
