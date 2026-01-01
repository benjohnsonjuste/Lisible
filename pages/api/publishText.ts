import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../lib/supabase"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { title, content, preview, author_id } = req.body

  if (!title || !content || !preview || !author_id) {
    return res.status(400).json({ error: "Missing fields" })
  }

  const { data, error } = await supabase
    .from("texts")
    .insert([{ title, content, preview, author_id }])
    .select()
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json(data)
}