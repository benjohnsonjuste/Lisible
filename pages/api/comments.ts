import { supabase } from "../lib/supabase"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { text_id } = req.query

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("text_id", text_id)
    .order("created_at", { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json(data)
}