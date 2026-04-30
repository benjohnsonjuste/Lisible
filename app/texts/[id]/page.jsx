import React from "react";
import TextContent from "./TextContent"; 

export async function generateMetadata({ params }) {
  const { id } = params;
  const baseUrl = "https://lisible.biz";

  try {
    const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`, { cache: 'no-store' });
    if (!res.ok) return { title: "Chargement... | Lisible" };
    
    const data = await res.json();
    const text = data?.content;
    if (!text) return { title: "Manuscrit introuvable | Lisible" };

    const ogImage = text.image ? text.image : `${baseUrl}/og-default.jpg`;
    const shareTitle = `${text.title} — ${text.authorName}`;
    const shareDesc = `Découvrez ce texte magnifique sur Lisible. ✨`;

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

export default function Page({ params }) {
  // On passe l'id directement pour éviter les erreurs de lecture des params côté client
  return <TextContent id={params.id} />;
}
