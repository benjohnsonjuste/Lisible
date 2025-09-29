"use client"; // pour rendre côté client et utiliser Firebase Auth

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Library() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedCaractere, setSelectedCaractere] = useState("all");

  const [user, setUser] = useState(null);

  // 🔹 Écoute Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Charger les textes avec filtres
  const fetchTexts = async () => {
    setLoading(true);
    try {
      let q = collection(db, "bibliotheque");

      if (selectedGenre !== "all" && selectedCaractere !== "all") {
        q = query(
          collection(db, "bibliotheque"),
          where("genre", "==", selectedGenre),
          where("caractere", "==", selectedCaractere)
        );
      } else if (selectedGenre !== "all") {
        q = query(collection(db, "bibliotheque"), where("genre", "==", selectedGenre));
      } else if (selectedCaractere !== "all") {
        q = query(collection(db, "bibliotheque"), where("caractere", "==", selectedCaractere));
      }

      const querySnapshot = await getDocs(q);
      const fetchedTexts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTexts(fetchedTexts);
    } catch (e) {
      console.error("Erreur lors du chargement des textes :", e);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fonction pour liker un texte
  const handleLike = async (text) => {
    if (!user) {
      alert("Veuillez vous connecter pour liker ce texte.");
      return;
    }

    const likedByArray = Array.isArray(text.likedBy) ? text.likedBy : [];

    if (likedByArray.includes(user.uid)) {
      alert("Vous avez déjà aimé ce texte.");
      return;
    }

    try {
      const textRef = doc(db, "bibliotheque", text.id);
      await updateDoc(textRef, {
        likes: (text.likes || 0) + 1,
        likedBy: arrayUnion(user.uid),
      });

      setTexts((prev) =>
        prev.map((t) =>
          t.id === text.id
            ? { ...t, likes: (t.likes || 0) + 1, likedBy: [...likedByArray, user.uid] }
            : t
        )
      );
    } catch (e) {
      console.error("Erreur lors du like :", e);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, [selectedGenre, selectedCaractere]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Bibliothèque</h1>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col">
          <label className="font-semibold mb-1">Filtrer par Genre :</label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Tout</option>
            <option value="Poésie">Poésie</option>
            <option value="Roman">Roman</option>
            <option value="Nouvelle">Nouvelle</option>
            <option value="Essai">Essai</option>
            <option value="Article">Article</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="font-semibold mb-1">Filtrer par Caractère :</label>
          <select
            value={selectedCaractere}
            onChange={(e) => setSelectedCaractere(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Tout</option>
            <option value="Engagé">Engagé</option>
            <option value="Couleur locale">Couleur locale</option>
            <option value="Romantique">Romantique</option>
            <option value="Érotique">Érotique</option>
            <option value="Satyrique">Satyrique</option>
            <option value="Mélancolique">Mélancolique</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center">Chargement des textes...</p>
      ) : texts.length === 0 ? (
        <p className="text-center text-gray-500">Aucun texte trouvé.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {texts.map((t) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded shadow hover:shadow-lg transition"
            >
              <div className="mb-3">
                <img
                  src={t.illustrationUrl || "/no_image.png"}
                  alt={t.title}
                  className="w-full h-40 object-cover rounded"
                />
              </div>

              <h3 className="text-xl font-semibold">{t.title}</h3>
              <p className="text-sm text-gray-500">
                Auteur : {t.authorName || "Anonyme"}
              </p>

              <div className="mt-2 flex gap-3 text-sm">
                {t.genre && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{t.genre}</span>
                )}
                {t.caractere && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{t.caractere}</span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-gray-600 text-sm">
                <span>
                  Vues : <span className="font-semibold">{t.views || 0}</span>
                </span>

                <button
                  onClick={() => handleLike(t)}
                  className={`flex items-center gap-1 ${
                    t.likedBy?.includes(user?.uid) ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={t.likedBy?.includes(user?.uid)}
                  title={
                    t.likedBy?.includes(user?.uid)
                      ? "Vous avez déjà aimé"
                      : "J'aime"
                  }
                >
                  <img src="/like.svg" alt="J'aime" className="w-5 h-5" />
                  <span>{t.likes || 0}</span>
                </button>
              </div>

              <Link href={`/bibliotheque/${t.id}`} legacyBehavior>
                <a className="text-blue-600 mt-3 inline-block hover:underline">
                  Lire plus
                </a>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}