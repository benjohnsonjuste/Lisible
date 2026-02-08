import React from "react";
import { notFound } from "next/navigation";
import TextPageClient from "./TextPageClient";

async function getFullData(id) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications/${id}.json?t=${Date.now()}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;

    const fileData = await res.json();
    const initialText = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));

    const indexRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/index.json`,
      { next: { revalidate: 3600 } }
    );
    
    let allTexts = [];
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      allTexts = JSON.parse(decodeURIComponent(escape(atob(indexData.content))));
    }

    return { initialText, allTexts };
  } catch (e) {
    return null;
  }
}

export default async function Page({ params }) {
  const data = await getFullData(params.id);
  if (!data) notFound();

  return (
    <TextPageClient 
      initialText={data.initialText} 
      id={params.id} 
      allTexts={data.allTexts} 
    />
  );
}
