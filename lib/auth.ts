import { getServerSession } from "next-auth"
import { authOptions } from "../lib/authOptions"

export async function requireAuth(req: any, res: any) {
  const session = await getServerSession(req, res, authOptions)
  return session
}