import LivreReader from "@/components/LivreReader";

const baseUrl = "https://lisible.biz";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams && resolvedParams.id;
  if (!id) return { title: "Livre — Lisible" };
  try {
    const res = await fetch(`${baseUrl}/api/livres?id=${id}`, { cache: "no-store" });
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

export default async function LivrePage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams && resolvedParams.id;
  return <LivreReader id={id} />;
}
