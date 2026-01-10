import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const session = await requireAuth(req, res)
    if (!session) return

    const { textId, content } = req.body
    const { data, error } = await supabase
      .from("comments")
      .insert([{ text_id: textId, content, user_id: session.user.id }])
      .select()

    if (error) return res.status(400).json({ error: error.message })
    res.status(200).json(data)
  } else {
    res.status(405).end()
  }
}
