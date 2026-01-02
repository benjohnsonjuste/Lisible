import { getServerSession } from "next-auth"
import type { NextApiRequest, NextApiResponse } from "next"
import { authOptions } from "./authOptions"

export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return getServerSession(req, res, authOptions)
}