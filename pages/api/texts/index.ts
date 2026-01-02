import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabase"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const { data, error } = await supabase.from("texts").select("*")
  if (error) return res.status(500).json({ error: error.message })

  res.status(200).json(data)
}