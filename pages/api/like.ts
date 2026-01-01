import { supabase } from "../../lib/supabase"
import type { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { text_id } = req.query

  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("text_id", text_id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(200).json({ count })
}