import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import Link from "next/link";

export default function AuthorPage({ authorId }) {
  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);
  const [loadingAuthor, setLoadingAuthor] = useState(true);
  const [loadingTexts, setLoadingTexts] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [updatingSub, setUpdatingSub] = useState(false);

  const user = auth.currentUser;

  /** Charger les infos de l'auteur */
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        setLoadingAuthor(true);
        const docRef = doc(db, "authors", authorId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const authorData = { id: docSnap.id, ...docSnap.data() };
          setAuthor(authorData);

          // Vérifier si l'utilisateur est déjà abonné
          if (user && authorData.subscribers?.includes(user.uid)) {
            setSubscribed(true);
          }
        } else {
          setAuthor(null);
        }
      } catch (error) {
        console.error("Erreur chargement auteur :", error);
      } finally {
        setLoadingAuthor(false);
      }
    };

    if (authorId) fetchAuthor();
  }, [authorId, user]);

  /** Charger les textes de l'auteur */
  useEffect(() => {
    const fetchTexts = async () => {
      try {
        setLoadingTexts(true);
        const q = query(collection(db, "texts"), where("authorId", "==", authorId));
        const snapshot = await getDocs(q);

        setTexts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Erreur chargement textes :", error);
      } finally {
        setLoadingTexts(false);
      }
    };

    if (authorId) fetchTexts();
  }, [authorId]);

  /** Gérer l'abonnement */
  const toggleSubscribe = async () => {
    if (!user) {
      alert("Veuillez vous connecter pour vous abonner.");
      return;
    }

    const authorRef = doc(db, "authors", authorId);

    try {
      setUpdatingSub(true);

      if (subscribed) {
        await updateDoc(authorRef, {
          subscribers: arrayRemove(user.uid),
        });
        setSubscribed(false);
      } else {
        await updateDoc(authorRef, {
          subscribers: arrayUnion(user.uid),
        });
        setSubscribed(true);
      }
    } catch (error) {
      console.error("Erreur lors de l'abonnement :", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setUpdatingSub(false);
    }
  };

  /** Loading état auteur */
  if (loadingAuthor) {
    return <p className="text-center mt-10">Chargement de l'auteur...</p>;
  }

  if (!author) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 text-lg font-semibold">Auteur introuvable</p>
        <Link href="/bibliotheque" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Infos de l'auteur */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 bg-white p-6 rounded shadow">
        <img
          src={author.photoURL || "/logo.png"}
          alt={author.fullName || "Auteur"}
          className="w-32 h-32 rounded-full object-cover border border-gray-200"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">{author.fullName}</h1>
          {author.bio && <p className="mt-2 text-gray-600">{author.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <span className="text-gray-700">
              Abonnés : <strong>{author.subscribers?.length || 0}</strong>
            </span>

            <button
              onClick={toggleSubscribe}
              disabled={updatingSub}
              className={`flex items-center gap-2 px-4 py-2 rounded transition ${
                subscribed
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <img
                src={subscribed ? "/user-follow-line-1.svg" : "/follow-109.svg"}
                alt={subscribed ? "Abonné(e)" : "S'abonner"}
                className="w-5 h-5"
              />
              <span>{subscribed ? "Abonné(e)" : "S'abonner"}</span>
            </button>

            {author.email && (
              <a
                href={`mailto:${author.email}`}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded"
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

      {loadingTexts ? (
        <p className="text-center">Chargement des textes...</p>
      ) : texts.length === 0 ? (
        <p className="text-gray-500">Aucun texte publié par cet auteur.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {texts.map((t) => (
            <div
              key={t.id}
              className="bg-white p-4 rounded shadow hover:shadow-lg transition"
            >
              <div className="mb-3">
                <img
                  src={t.imageUrl || "/no_image.png"}
                  alt={t.title}
                  className="w-full h-40 object-cover rounded"
                />
              </div>
              <h3 className="text-xl font-semibold">{t.title}</h3>
              <p className="text-sm text-gray-500">
                {t.genre} {t.character && `- ${t.character}`}
              </p>
              <div className="mt-2 text-gray-600 text-sm">
                Vues : <strong>{t.views || 0}</strong> | J'aime :{" "}
                <strong>{t.likes || 0}</strong>
              </div>
              <Link
                href={`/bibliotheque/${t.id}`}
                className="text-blue-600 mt-3 inline-block hover:underline"
              >
                Lire plus
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Récupérer l'id de l'auteur depuis l'URL */
export async function getServerSideProps(context) {
  return {
    props: { authorId: context.params.id },
  };
}