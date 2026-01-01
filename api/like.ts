import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const session = await getServerSession(req, res)
  if (!session) return res.status(401).end()

  const { textId } = req.body

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("text_id", textId)
    .maybeSingle()

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id)
  } else {
    await supabase.from("likes").insert({
      user_id: session.user.id,
      text_id: textId
    })
  }

  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("text_id", textId)

  res.json({ likes: count })
}