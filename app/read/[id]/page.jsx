"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

export default function ReadPage() {
  const { id } = useParams();
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadText = async () => {
      try {
        const docRef = doc(db, "texts", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setText({ id: docSnap.id, ...docSnap.data() });
        } else {
          setText(null);
        }
      } catch (error) {
        console.error("Erreur de lecture :", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadText();
  }, [id]);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">Chargement...</p>;

  if (!text)
    return (
      <div className="text-center mt-20">
        <p className="text-gray-500 mb-4">Texte introuvable 😢</p>
        <Link href="/library" className="text-blue-600 underline">
          Retour à la bibliothèque
        </Link>
      </div>
    );

  return (
    <article className="max-w-3xl mx-auto py-10 px-4">
      <Link
        href="/library"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Retour à la bibliothèque
      </Link>

      <h1 className="text-3xl font-bold mb-2">{text.title}</h1>

      <p className="text-gray-500 mb-6">
        Publié le{" "}
        {text.createdAt?.toDate
          ? text.createdAt.toDate().toLocaleDateString()
          : "date inconnue"}
      </p>

      {text.imageUrl && (
        <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
          <Image
            src={text.imageUrl}
            alt={text.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="prose prose-gray max-w-none text-lg leading-relaxed">
        {text.content
          ?.split("\n")
          .map((para, i) => (
            <p key={i} className="mb-4">
              {para}
            </p>
          ))}
      </div>

      <footer className="mt-10 border-t pt-4 text-sm text-gray-500">
        <p>
          Auteur :{" "}
          <span className="font-medium">
            {text.authorName || "Auteur anonyme"}
          </span>
        </p>
      </footer>
    </article>
  );
        }

