import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { data, error } = await supabase
    .from("texts")
    .select("id, auteur, titre, contenu, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur Supabase:", error.message);
    return res.status(500).json({ error: "Erreur de récupération des textes" });
  }

  const posts = data.map((item) => ({
    id: item.id,
    auteur: item.auteur,
    titre: item.titre,
    contenu: item.contenu,
    image_url: item.image_url || null,
    date: item.created_at,
  }));

  return res.status(200).json(posts);
}