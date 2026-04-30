import React from "react";
import TextContent from "./TextContent"; 

export async function generateMetadata({ params }) {
  // Attendre les params car ils sont asynchrones dans les versions récentes de Next.js
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  const baseUrl = "https://lisible.biz";

  if (!id) return { title: "Chargement... | Lisible" };

  try {
    const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`, { cache: 'no-store' });
    if (!res.ok) return { title: "Chargement... | Lisible" };
    
    const data = await res.json();
    const text = data?.content;
    if (!text) return { title: "Manuscrit introuvable | Lisible" };

    const ogImage = text.image ? text.image : `${baseUrl}/og-default.jpg`;
    const shareTitle = `${text.title} — ${text.authorName}`;
    const shareDesc = `Découvrez ce texte magnifique sur Lisible.`;

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

export default async function Page({ params }) {
  // On attend les params côté serveur pour garantir que l'id est passé proprement au composant client
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  return <TextContent id={id} />;
}
