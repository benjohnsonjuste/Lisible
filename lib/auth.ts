import { getServerSession } from "next-auth"
import type { NextApiRequest, NextApiResponse } from "next"
import { authOptions } from "@/lib/authOptions"

export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    res.status(401).end()
    return null
  }
  return session
}