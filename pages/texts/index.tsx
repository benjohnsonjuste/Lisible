import useSWR from "swr"
import Link from "next/link"

export default function Texts() {
  const { data } = useSWR("/api/texts", url => fetch(url).then(r => r.json()))

  if (!data) return null

  return (
    <div>
      {data.map(t => (
        <Link key={t.id} href={`/texts/${t.id}`}>
          <div>
            <h3>{t.title}</h3>
            <p>{t.preview}</p>
            ❤️ {t.likes}
          </div>
        </Link>
      ))}
    </div>
  )
}
