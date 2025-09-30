import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

export default function TextDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      const docRef = doc(db, "bibliotheque", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Incrémenter les vues
        await updateDoc(docRef, {
          views: increment(1),
        });

        setText({ id: docSnap.id, ...data });
      } else {
        setText(null);
      }

      setLoading(false);
    };

    fetchText();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;

  if (!text)
    return (
      <div className="text-center mt-10">
        <p className="text-red-500">Texte introuvable.</p>
        <Link href="/bibliotheque" className="text-blue-600 hover:underline">
          ← Retour à la bibliothèque
        </Link>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/bibliotheque" className="text-blue-600 hover:underline">
        ← Retour à la bibliothèque
      </Link>

      <h1 className="text-3xl font-bold mt-4">{text.title}</h1>
      <p className="text-gray-500">par {text.authorName || "Anonyme"}</p>

      {text.illustrationUrl && (
        <img
          src={text.illustrationUrl}
          alt={text.title}
          className="w-full rounded-lg mt-4"
        />
      )}

      <div className="mt-6 bg-white p-4 rounded-lg shadow whitespace-pre-line">
        {text.content}
      </div>

      <div className="mt-4 text-sm text-gray-500 flex justify-between">
        <span>Vues : {text.views || 0}</span>
        <span>Likes : {text.likes || 0}</span>
      </div>
    </div>
  );
}