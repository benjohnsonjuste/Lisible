import { useRouter } from "next/router"
import useSWR from "swr"
import { useState } from "react"

export default function TextPage() {
  const { query } = useRouter()
  const { data, mutate } = useSWR(
    query.id ? `/api/texts/${query.id}` : null,
    url => fetch(url).then(r => r.json())
  )

  const [comment, setComment] = useState("")

  if (!data) return null

  async function like() {
    await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textId: data.id })
    })
    mutate()
  }

  async function sendComment(e) {
    e.preventDefault()
    await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textId: data.id, content: comment })
    })
    setComment("")
    mutate()
  }

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>

      <button onClick={like}
        style={{ color: data.likedByUser ? "red" : "gray" }}>
        ❤️ {data.likes}
      </button>

      <button onClick={() =>
        navigator.share?.({
          title: data.title,
          url: window.location.href
        })
      }>
        Partager
      </button>

      <form onSubmit={sendComment}>
        <textarea value={comment} onChange={e => setComment(e.target.value)} />
        <button>Commenter</button>
      </form>

      {data.comments.map(c => (
        <p key={c.id}>
          <b>{c.user.name}</b> : {c.content}
        </p>
      ))}
    </div>
  )
}
