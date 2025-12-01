import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/texts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setText(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-10 text-center">Chargement…</div>;
  if (!text) return <div className="p-10 text-center">Texte non trouvé</div>;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">{text.title}</h1>
      <article className="prose">
        {text.content.split("\n").map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </article>
    </div>
  );
}