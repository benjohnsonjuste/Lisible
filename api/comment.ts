import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../lib/supabase"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { content, user_id, text_id } = req.body

  if (!content || !user_id || !text_id) {
    return res.status(400).json({ error: "Missing fields" })
  }

  const { data, error } = await supabase
    .from("comments")
    .insert([{ content, user_id, text_id }])
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json(data)
}