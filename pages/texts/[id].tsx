import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getServerSession(req, res)

  const { data: text, error } = await supabase
    .from("texts")
    .select(`
      id,
      title,
      content,
      created_at,
      likes(user_id),
      comments (
        id,
        content,
        user_id,
        created_at
      )
    `)
    .eq("id", id)
    .single()

  if (error) return res.status(404).end()

  const likedByUser = session
    ? text.likes.some(l => l.user_id === session.user.id)
    : false

  res.json({
    ...text,
    likes: text.likes.length,
    likedByUser
  })
}