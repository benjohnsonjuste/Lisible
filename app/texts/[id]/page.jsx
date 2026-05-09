import React from "react";
import Script from "next/script";
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
      backgroundColor: "#FDFCF8",
      color: "#1A1A1A",           
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      transition: "background-color 0.3s ease"
    }}>
      {/* Publicité Native In-Text */}
      <div
        style={{
          width: "100%",
          minHeight: "280px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden"
        }}
      >
        <Script
          async
          strategy="afterInteractive"
          data-cfasync="false"
          src="https://pl28554024.profitablecpmratenetwork.com/874a186feecd3e968c16a58bb085fd56/invoke.js"
        />

        <div id="container-874a186feecd3e968c16a58bb085fd56"></div>
      </div>

      {/* On passe l'id ici pour que TextContent puisse l'utiliser pour le Like et le Share */}
      <TextContent id={id} />
    </div>
  );
}