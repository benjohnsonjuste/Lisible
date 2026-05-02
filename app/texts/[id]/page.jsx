import React from "react";
import TextContent from "./TextContent"; 

export async function generateMetadata({ params }) {
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
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  return (
    <div style={{ 
      backgroundColor: "#FDFCF8", // Couleur crème pour réduire la fatigue oculaire
      color: "#1A1A1A",           // Noir doux pour un contraste optimal
      minHeight: "100vh",
      transition: "background-color 0.3s ease"
    }}>
      <TextContent id={id} />
    </div>
  );
}
