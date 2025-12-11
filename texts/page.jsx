import Link from "next/link";

export default async function Page() {
  const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/data/texts`;

  const res = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Impossible de charger les textes</h1>
      </div>
    );
  }

  const files = await res.json();

  // Ne garder que les .json
  const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

  // Télécharger chaque fichier
  const texts = await Promise.all(
    jsonFiles.map(async (file) => {
      const fileRes = await fetch(file.download_url);
      return await fileRes.json();
    })
  );

  // Trier du plus récent au plus ancien
  texts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tous les textes</h1>

      <div className="space-y-4">
        {texts.map((t) => (
          <Link
            key={t.id}
            href={`/texts/${t.id}`}
            className="block border p-4 rounded hover:bg-gray-100"
          >
            <h2 className="text-xl font-bold">{t.title}</h2>
            <p className="text-gray-600 mt-1">
              {t.authorName} —{" "}
              {new Date(t.createdAt).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
