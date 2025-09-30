"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function TextPage() {
  const router = useRouter();
  const { id } = router.query;
  const [text, setText] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchText = async () => {
      const docRef = doc(db, "bibliotheque", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setText({ id: docSnap.id, ...docSnap.data() });
      else setText(null);
    };

    fetchText();
  }, [id]);

  if (!text) return <p className="text-center mt-6">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>
      <p className="text-gray-500 mb-4">par {text.authorName}</p>
      {text.illustrationUrl && <img src={text.illustrationUrl} alt="" className="mb-4 rounded" />}
      <p className="text-gray-800 whitespace-pre-line">{text.content}</p>
    </div>
  );
}