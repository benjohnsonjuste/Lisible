import fs from "fs";
import path from "path";

export default function TextsPage() {
  const filePath = path.join(process.cwd(), "data", "texts.json");

  let texts = [];
  if (fs.existsSync(filePath)) {
    texts = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Bibliothèque</h1>

      {texts.length === 0 && <p>Aucun texte publié.</p>}

      {texts.map((t) => (
        <div key={t.id} className="border p-4 rounded bg-white">
          <h2 className="text-xl font-semibold">{t.title}</h2>
          <p className="text-sm text-gray-500">✍ {t.authorName}</p>
          <p className="mt-2 whitespace-pre-wrap">{t.content}</p>
        </div>
      ))}
    </div>
  );
}