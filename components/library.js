import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  updateDoc,
  increment,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Heart, MessageCircle, Eye } from "lucide-react";
import Link from "next/link";

export default function Library() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [selectedTextId, setSelectedTextId] = useState(null);

  // Charger la bibliothèque en temps réel
  useEffect(() => {
    const q = query(collection(db, "bibliotheque"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const textsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTexts(textsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fonction pour liker un texte
  const handleLike = async (textId) => {
    const textRef = doc(db, "bibliotheque", textId);
    await updateDoc(textRef, {
      likes: increment(1),
    });
  };

  // Ajouter un commentaire
  const handleAddComment = async (textId) => {
    if (!commentText.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      alert("Vous devez être connecté pour commenter !");
      return;
    }

    const commentRef = collection(db, "bibliotheque", textId, "comments");
    await addDoc(commentRef, {
      userId: user.uid,
      userName: user.displayName || "Utilisateur",
      content: commentText,
      createdAt: new Date(),
    });

    setCommentText("");
    setSelectedTextId(null);
  };

  // Incrémenter le compteur de vues
  const incrementView = async (textId) => {
    const textRef = doc(db, "bibliotheque", textId);
    await updateDoc(textRef, {
      views: increment(1),
    });
  };

  if (loading) {
    return <p className="text-center mt-4">Chargement de la bibliothèque...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Bibliothèque</h1>

      {texts.length === 0 ? (
        <p className="text-center">Aucun texte disponible.</p>
      ) : (
        texts.map((text) => (
          <div
            key={text.id}
            className="bg-white shadow-lg rounded-2xl p-4 space-y-3 border"
          >
            <h2 className="text-xl font-semibold">{text.title}</h2>
            <p className="text-sm text-gray-500">
              Par <span className="font-medium">{text.authorName || "Anonyme"}</span>
            </p>

            {/* Aperçu du texte */}
            <p className="text-gray-800">
              {text.content.length > 150
                ? `${text.content.substring(0, 150)}...`
                : text.content}
            </p>

            {/* Bouton lire la suite */}
            <Link
              href={`/bibliotheque/${text.id}`}
              onClick={() => incrementView(text.id)}
              className="text-blue-500 font-medium hover:underline"
            >
              Lire la suite
            </Link>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => handleLike(text.id)}
                className="flex items-center gap-1 text-red-500 hover:text-red-600"
              >
                <Heart size={18} /> {text.likes || 0}
              </button>

              <button
                onClick={() => setSelectedTextId(selectedTextId === text.id ? null : text.id)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <MessageCircle size={18} /> Commenter
              </button>

              <div className="flex items-center gap-1 text-gray-500">
                <Eye size={18} /> {text.views || 0}
              </div>
            </div>

            {/* Zone de commentaire */}
            {selectedTextId === text.id && (
              <div className="mt-3">
                <textarea
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="Votre commentaire..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                  onClick={() => handleAddComment(text.id)}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Envoyer
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}