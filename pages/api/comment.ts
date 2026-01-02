import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const session = await requireAuth(req, res)
  if (!session) return

  const { textId, content } = req.body

  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        text_id: textId,
        content,
        user_id: session.user.id,
      },
    ])

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json(data)
}