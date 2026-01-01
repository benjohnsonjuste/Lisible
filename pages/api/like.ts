import { supabase } from "../../lib/supabase"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { user_id, text_id } = req.body

  const { error } = await supabase
    .from("likes")
    .insert([{ user_id, text_id }])

  if (error) {
    return res.status(400).json({ error: "Already liked" })
  }

  res.status(200).json({ success: true })
}