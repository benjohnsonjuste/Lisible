import React from "react";
import TextContent from "./TextContent"; 

// Ajout pour la compatibilité Cloudflare Pages (Edge Runtime)
export const runtime = 'edge';

/**
 * GÉNÉRATION DES MÉTADONNÉES (SERVEUR)
 */
export async function generateMetadata({ params }) {
  const { id } = params;
  const baseUrl = "https://lisible.biz";

  try {
    const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`, { cache: 'no-store' });
    
    // Sécurité : Vérification si la réponse est valide
    if (!res.ok) return { title: "Chargement du manuscrit... | Lisible" };
    
    const data = await res.json();
    const text = data?.content;

    if (!text) return { title: "Manuscrit introuvable | Lisible" };

    const isBattle = text.isConcours === true || text.isConcours === "true" || text.genre === "Battle Poétique";
    const ogImage = (isBattle || !text.image) ? `${baseUrl}/og-default.jpg` : text.image;
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
  // Le suspense ou la gestion d'état de TextContent s'occupera du rendu
  return <TextContent params={params} />;
}
  
