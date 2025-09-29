import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";

// Exemple temporaire avant d'intégrer Firebase
const sample = {
  "1": { title: "Le Voyageur", author: "Jean Dupont", content: "Le vent soufflait fort..." },
  "2": { title: "L'Étoile Perdue", author: "Marie Claire", content: "Dans l'immensité de la nuit, une étoile s'éteignit..." }
};

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);

  useEffect(() => {
    if (id) {
      setText(sample[id] || null);
    }
  }, [id]);

  if (!id) {
    return <div className="text-center mt-10">Chargement...</div>;
  }

  if (!text) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 text-lg font-semibold">Texte non trouvé</p>
        <Link href="/bibliotheque" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Bouton retour */}
      <div className="mb-4">
        <Link href="/bibliotheque" className="text-blue-600 hover:underline">
          ← Retour à la bibliothèque
        </Link>
      </div>

      {/* Titre */}
      <h1 className="text-3xl font-bold text-gray-800">{text.title}</h1>
      <p className="text-gray-500 mb-4">par {text.author}</p>

      {/* Contenu */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow whitespace-pre-line">
        {text.content}
      </div>
    </div>
  );
}