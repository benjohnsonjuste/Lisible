import React from "react";
import TextContent from "./TextContent"; 
import Script from "next/script"; // <--- IMPORTATION DU COMPOSANT DE SCRIPT RECOMMANDÉ

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
      backgroundColor: "#FDFCF8", 
      color: "#1A1A1A",           
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      transition: "background-color 0.3s ease"
    }}>
      {/* Native Banner Adsterra */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 0",
        }}
      >
        <div id="container-874a186feecd3e968c16a58bb085fd56"></div>

        {/* Next.js optimisera automatiquement l'injection de ce script */}
        <Script
          async
          data-cfasync="false"
          src="https://pl28554024.effectivecpmnetwork.com/874a186feecd3e968c16a58bb085fd56/invoke.js"
          strategy="afterInteractive"
        />
      </div>

      <TextContent id={id} />
    </div>
  );
}
