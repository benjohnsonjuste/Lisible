import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const session = await getServerSession(req, res)
  if (!session) return res.status(401).end()

  const { textId, content } = req.body

  const { data } = await supabase.from("comments").insert({
    text_id: textId,
    content,
    user_id: session.user.id
  }).select().single()

  res.json(data)
}
