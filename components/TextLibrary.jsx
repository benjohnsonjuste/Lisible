export default async function TextLibrary() {
  const res = await fetch("https://<TON_BLOB_URL>/texts/index.json", { cache: "no-store" });

  if (!res.ok) {
    return <p className="text-center text-gray-500 mt-10">Aucun texte disponible.</p>;
  }

  const texts = await res.json();

  return (
    <div className="grid gap-4 p-4 max-w-4xl mx-auto">
      {texts.map((t) => (
        <div key={t.id} className="border rounded-xl p-4 shadow-sm bg-white">
          {t.imageUrl && <img src={t.imageUrl} alt="" className="w-full h-auto rounded mb-3" />}
          <h2 className="text-xl font-bold mb-2">{t.title}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{t.content}</p>
          <p className="text-sm text-gray-500 mt-2">
            Publié le {new Date(t.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
