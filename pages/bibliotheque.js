import { useEffect, useState } from "react";

export default function LibraryBook() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTexts() {
      try {
        // 1. Lister les fichiers dans le dossier sur GitHub
        const res = await fetch("https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications");
        const files = await res.json();
        
        if (Array.isArray(files)) {
          // 2. Récupérer le contenu de chaque fichier JSON
          const dataPromises = files.map(file => fetch(file.download_url).then(r => r.json()));
          const allTexts = await Promise.all(dataPromises);
          setTexts(allTexts);
        }
      } catch (e) {
        console.error("Erreur de chargement", e);
      } finally {
        setLoading(false);
      }
    }
    loadTexts();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement de la bibliothèque...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 grid gap-6">
      <h1 className="text-3xl font-bold">Bibliothèque GitHub</h1>
      {texts.length === 0 && <p>Aucun texte trouvé.</p>}
      {texts.map((item, i) => (
        <div key={i} className="bg-white p-6 shadow rounded-xl border">
          {item.imageBase64 && <img src={item.imageBase64} className="w-full h-64 object-cover rounded-lg mb-4" />}
          <h2 className="text-2xl font-bold">{item.title}</h2>
          <p className="text-blue-600 font-medium">Par {item.authorName}</p>
          <p className="mt-4 text-gray-700 whitespace-pre-wrap">{item.content}</p>
        </div>
      ))}
    </div>
  );
}
