import { useEffect, useState } from "react"
import { useRouter } from "next/router"

export default function TextPage() {
  const router = useRouter()
  const { id } = router.query

  const [text, setText] = useState<any>(null)
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState<any[]>([])

  useEffect(() => {
    if (!id) return

    fetch(`/api/texts/${id}`).then(r => r.json()).then(setText)
    fetch(`/api/likes?text_id=${id}`).then(r => r.json()).then(d => setLikes(d.count))
    fetch(`/api/comments?text_id=${id}`).then(r => r.json()).then(setComments)
  }, [id])

  const like = async () => {
    if (liked) return
    await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text_id: id, user_id: "demo-user" })
    })
    setLiked(true)
    setLikes(likes + 1)
  }

  const sendComment = async () => {
    await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text_id: id,
        user_id: "demo-user",
        content: comment
      })
    })
    setComment("")
  }

  if (!text) return null

  return (
    <>
      <h1>{text.title}</h1>
      <p>{text.content}</p>

      <button
        onClick={like}
        style={{ opacity: liked ? 1 : 0.5 }}
      >
        ❤️ {likes}
      </button>

      <div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} />
        <button onClick={sendComment}>Commenter</button>
      </div>

      {comments.map(c => (
        <p key={c.id}>{c.content}</p>
      ))}
    </>
  )
}