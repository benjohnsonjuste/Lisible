import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const session = await getServerSession(req, res)
  if (!session) return res.status(401).end()

  const { title, content } = req.body

  const { error } = await supabase.from("texts").insert({
    title,
    content,
    preview: content.slice(0, 150),
    author_id: session.user.id
  })

  if (error) return res.status(500).json(error)

  res.json({ success: true })
}
