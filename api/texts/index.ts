import useSWR from "swr"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function TextsPage() {
  const { data } = useSWR("/api/texts", fetcher)

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