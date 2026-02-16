import React from "react";
import TextContent from "./TextContent"; 

// Utilisation du runtime nodejs pour correspondre à la configuration de l'API github-db
export const runtime = 'nodejs';

/**
 * GÉNÉRATION DES MÉTADONNÉES (SERVEUR)
 */
export async function generateMetadata({ params }) {
  const { id } = params;
  const baseUrl = "https://lisible.biz";

  try {
    // Appel à l'API unifiée qui renvoie { content: {...}, sha: "..." }
    const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`, { cache: 'no-store' });
    const data = await res.json();
    
    // Extraction des données du texte depuis l'enveloppe 'content'
    const text = data?.content;

    if (!text) return { title: "Manuscrit introuvable | Lisible" };

    const isBattle = text.isConcours === true || text.isConcours === "true" || text.genre === "Battle Poétique";
    const ogImage = (isBattle || !text.image) ? `${baseUrl}/og-default.jpg` : text.image;
    const shareTitle = `${text.title} — ${text.authorName}`;
    const shareDesc = `Découvrez ce texte magnifique de ${text.authorName} sur Lisible. ✨`;

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
