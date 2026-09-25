import LivreReader from "@/components/LivreReader";

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`https://lisible.biz/api/livres?id=${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      const b = j.content || {};
      return {
        title: `${b.title || "Livre"} — Lisible`,
        description: (b.description || "").slice(0, 160),
      };
    }
  } catch {}
  return { title: "Livre — Lisible" };
}

export default function LivrePage({ params }) {
  return <LivreReader id={params.id} />;
}
