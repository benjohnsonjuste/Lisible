import React from "react";
import TextContent from "./TextContent";

export const runtime = 'nodejs';

export async function generateMetadata({ params }) {
  const { id } = params;
  const baseUrl = "https://lisible.biz";

  try {
    const res = await fetch(`${baseUrl}/api/github-db?type=text&id=${id}`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) throw new Error();
    const data = await res.json();

    // Déballage sécurisé
    const text = (data?.content && typeof data.content === 'object' && data.content.title) 
      ? data.content 
      : (data?.title ? data : null);

    if (!text) return { title: "Manuscrit introuvable | Lisible" };

    const isBattle = text.isConcours === true || text.isConcours === "true" || text.genre === "Battle Poétique";
    const ogImage = (isBattle || !text.image) ? `${baseUrl}/og-default.jpg` : text.image;
    const shareTitle = `${text.title} — ${text.authorName || text.author || "Auteur"}`;

    return {
      title: shareTitle,
      description: "Découvrez ce texte magnifique sur Lisible. ✨",
      openGraph: {
        title: shareTitle,
        url: `${baseUrl}/texts/${id}`,
        images: [{ url: ogImage }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: shareTitle,
        images: [ogImage],
      },
    };
  } catch (e) {
    return { title: "Lecture | Lisible" };
  }
}

export default function Page({ params }) {
  return <TextContent params={params} />;
}
