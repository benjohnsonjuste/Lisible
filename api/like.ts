import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const session = await requireAuth(req, res)
  if (!session) return

  const { textId } = req.body

  const existing = await prisma.like.findUnique({
    where: {
      userId_textId: {
        userId: session.user.id,
        textId
      }
    }
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
  } else {
    await prisma.like.create({
      data: {
        userId: session.user.id,
        textId
      }
    })
  }

  const count = await prisma.like.count({ where: { textId } })
  res.json({ likes: count })
}
