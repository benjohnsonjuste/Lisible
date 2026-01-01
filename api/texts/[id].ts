import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export default async function handler(req, res) {
  const { id } = req.query
  const session = await getServerSession(req, res)

  const text = await prisma.text.findUnique({
    where: { id },
    include: {
      comments: {
        include: { user: true },
        orderBy: { createdAt: "desc" }
      },
      likes: true
    }
  })

  if (!text) return res.status(404).end()

  const likedByUser = session
    ? text.likes.some(l => l.userId === session.user.id)
    : false

  res.json({
    ...text,
    likes: text.likes.length,
    likedByUser
  })
}
