import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { collection, doc, query, where, getDocs, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import Link from "next/link";

export default function AuthorPage({ authorId }) {
  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [subscribed, setSubscribed] = useState(false);
  const user = auth.currentUser;

  // Charger les infos de l'auteur
  useEffect(() => {
    const fetchAuthor = async () => {
      const docRef = doc(db, "authors", authorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAuthor({ id: docSnap.id, ...docSnap.data() });
        // Vérifier si l'utilisateur est déjà abonné
        if (user && docSnap.data().subscribers?.includes(user.uid)) {
          setSubscribed(true);
        }
      }
    };
    fetchAuthor();
  }, [authorId, user]);

  // Charger les textes de l'auteur
  useEffect(() => {
    const fetchTexts = async () => {
      const q = query(collection(db, "texts"), where("authorId", "==", authorId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTexts(data);
    };
    fetchTexts();
  }, [authorId]);

  // S'abonner / Se désabonner
  const toggleSubscribe = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour vous abonner.");
      return;
    }
    const authorRef = doc(db, "authors", authorId);
    try {
      if (subscribed) {
        // Se désabonner
        await updateDoc(authorRef, { subscribers: arrayRemove(user.uid) });
        setSubscribed(false);
      } else {
        // S'abonner
        await updateDoc(authorRef, { subscribers: arrayUnion(user.uid) });
        setSubscribed(true);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la mise à jour de l'abonnement.");
    }
  };

  if (!author) return <p>Chargement de l'auteur...</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Infos de l'auteur */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 bg-white p-6 rounded shadow">
        <img
          src={author.photoURL || "/logo.png"}
          alt={author.fullName || "Auteur"}
          className="w-32 h-32 rounded-full object-cover"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{author.fullName}</h1>
          {author.bio && <p className="mt-2 text-gray-600">{author.bio}</p>}
          <div className="mt-4 flex gap-4 items-center">
            <span>Abonnés : <strong>{author.subscribers?.length || 0}</strong></span>
            <button
              onClick={toggleSubscribe}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              <img
                src={
                  subscribed
                    ? "/user-follow-line-1.svg"
                    : "/follow-109.svg"
                }
                alt={subscribed ? "Abonné(e)" : "S'abonner"}
                className="w-5 h-5"
              />
              <span>{subscribed ? "Abonné(e)" : "S'abonner"}</span>
            </button>
            {author.email && (
              <a
                href={`mailto:${author.email}`}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                <img src="/message.svg" alt="Email" className="w-5 h-5" />
                Envoyer un e-mail
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Textes de l'auteur */}
      <h2 className="text-2xl font-bold mb-4">Textes publiés</h2>
      {texts.length === 0 ? (
        <p>Aucun texte publié par cet auteur.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {texts.map(t => (
            <div key={t.id} className="bg-white p-4 rounded shadow hover:shadow-lg transition">
              <div className="mb-3">
                <img
                  src={t.imageUrl || "/no_image.png"}
                  alt={t.title}
                  className="w-full h-40 object-cover rounded"
                />
              </div>
              <h3 className="text-xl font-semibold">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.genre} {t.character && `- ${t.character}`}</p>
              <div className="mt-2 text-gray-600 text-sm">
                J'aime : <strong>{t.likes || 0}</strong>
              </div>
              <Link href={`/bibliotheque/${t.id}`}>
                <a className="text-blue-600 mt-3 inline-block hover:underline">Lire plus</a>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Récupérer l'id de l'auteur depuis l'URL
export async function getServerSideProps(context) {
  return {
    props: { authorId: context.params.id },
  };
}