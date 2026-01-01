import { prisma } from "@/lib/prisma"

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const texts = await prisma.text.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { likes: true } }
    }
  })

  res.json(
    texts.map(t => ({
      id: t.id,
      title: t.title,
      preview: t.preview,
      likes: t._count.likes
    }))
  )
}
