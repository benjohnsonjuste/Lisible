import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const session = await requireAuth(req, res)
  if (!session) return

  const { textId, content } = req.body

  const comment = await prisma.comment.create({
    data: {
      textId,
      content,
      userId: session.user.id
    }
  })

  res.json(comment)
}
