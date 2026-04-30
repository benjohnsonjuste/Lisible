import React from "react";
import TextContent from "./TextContent"; 

// Suppression du runtime 'edge' pour assurer la compatibilité avec les scripts publicitaires tiers
// qui nécessitent souvent un environnement standard pour l'hydratation des scripts.

/**
 * GÉNÉRATION DES MÉTADONNÉES (SERVEUR)
 */
export async function generateMetadata({ params }) {
  const { id } = params;
  const baseUrl = "https://lisible.biz";

  try {
    const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`, { cache: 'no-store' });
    
    if (!res.ok) return { title: "Chargement du manuscrit... | Lisible" };
    
    const data = await res.json();
    const text = data?.content;

    if (!text) return { title: "Manuscrit introuvable | Lisible" };

    const ogImage = text.image ? text.image : `${baseUrl}/og-default.jpg`;
    
    const shareTitle = `${text.title} — ${text.authorName}`;
    const shareDesc = `Je vous invite à apprécier ce magnifique texte sur Lisible. ✨`;

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
    return { title: "Lecture | Lisible" };
  }
}

/**
 * COMPOSANT PRINCIPAL (SERVEUR)
 */
export default function Page({ params }) {
  return <TextContent params={params} />;
}
