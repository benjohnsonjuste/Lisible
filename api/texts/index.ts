import { supabase } from "@/lib/supabase"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const { data, error } = await supabase
    .from("texts")
    .select(`
      id,
      title,
      preview,
      created_at,
      likes(count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const formatted = data.map(t => ({
    id: t.id,
    title: t.title,
    preview: t.preview,
    likes: t.likes?.[0]?.count ?? 0
  }))

  res.json(formatted)
}