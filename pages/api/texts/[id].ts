import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "../../lib/supabase"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  const { data, error } = await supabase
    .from("texts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return res.status(404).json({ error: "Text not found" })
  }

  res.status(200).json(data)
}