import React from "react";
import LumiLecture from "./LumiLecture"; 

// Utilisation du runtime nodejs pour la compatibilité avec l'API
export const runtime = 'nodejs';

/**
 * GÉNÉRATION DES MÉTADONNÉES (SERVEUR)
 * Permet d'afficher le titre et l'image du texte lors d'un partage (WhatsApp, Facebook, X)
 */
export async function generateMetadata({ params }) {
  const { id } = params;
  const baseUrl = "https://lisible.biz";

  try {
    // Récupération des données via l'API interne
    const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`, { 
      cache: 'no-store' 
    });
    const data = await res.json();
    
    // Déballage sécurisé du texte (que ce soit une enveloppe .content ou l'objet direct)
    const text = (data?.content && typeof data.content === 'object' && data.content.title) 
      ? data.content 
      : data;

    if (!text || !text.title) {
      return { title: "Manuscrit introuvable | Lisible" };
    }

    const shareTitle = `${text.title} — ${text.authorName || text.author || "Auteur inconnu"}`;
    const shareDesc = text.content 
      ? text.content.substring(0, 150).replace(/[#*]/g, '') + "..." 
      : "Découvrez cette œuvre sur Lisible, le sanctuaire de la littérature moderne.";
    
    // Image par défaut si aucune image n'est fournie
    const ogImage = text.image || `${baseUrl}/og-default.jpg`;

    return {
      title: shareTitle,
      description: shareDesc,
      openGraph: {
        title: shareTitle,
        description: shareDesc,
        url: `${baseUrl}/texts/${id}`,
        siteName: 'Lisible',
        images: [{ url: ogImage, width: 1200, height: 630 }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: shareTitle,
        description: shareDesc,
        images: [ogImage],
      },
    };
  } catch (e) {
    console.error("Erreur Metadata:", e);
    return { title: "Lecture | Lisible" };
  }
}

/**
 * COMPOSANT PAGE (SERVEUR -> CLIENT)
 * Cette page sert de pont vers le composant "use client" TextContent
 */
export default function Page({ params }) {
  // On passe l'ID aux params du composant client
  return (
    <>
      {/* On peut ajouter des balises JSON-LD ici pour le SEO Google Article si besoin */}
      <LumiLecture params={params} />
    </>
  );
}
