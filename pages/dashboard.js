import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { auth, db } from "../firebaseConfig";
import {
  signOut,
  updateProfile
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [texts, setTexts] = useState([]);
  const [subscribers, setSubscribers] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [gains, setGains] = useState(0);

  const DEFAULT_AVATAR = "/avatar.png";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        // Récupérer les infos utilisateur
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData({ uid: user.uid, ...userDoc.data() });
        }

        // Charger ses textes
        const q = query(
          collection(db, "texts"),
          where("authorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const userTexts = [];
        let totalVues = 0;
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          totalVues += data.views || 0;
          userTexts.push({ id: docSnap.id, ...data });
        });
        setTexts(userTexts);
        setTotalViews(totalVues);
        setGains(Math.floor(totalVues / 1000) * 0.2);

        // Compter abonnés
        const subSnap = await getDocs(
          collection(db, "subscribers") // collection des abonnés de l'auteur
        );
        const userSubs = subSnap.docs.filter(doc => doc.data().authorId === user.uid).length;
        setSubscribers(userSubs);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Déconnexion
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // Publier un texte
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!newTitle || !newContent) return alert("Veuillez remplir tous les champs.");

    setLoading(true);
    try {
      await addDoc(collection(db, "texts"), {
        title: newTitle,
        content: newContent,
        image: newImage || null,
        authorId: userData.uid,
        authorName: userData.name,
        views: 0,
        createdAt: serverTimestamp(),
      });

      setNewTitle("");
      setNewContent("");
      setNewImage(null);

      alert("Texte publié avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la publication.");
    }
    setLoading(false);
  };

  if (!userData) return <Layout><div className="text-center mt-24">Chargement...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-xl">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img
              src={userData.photoURL || DEFAULT_AVATAR}
              alt="Profil"
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-600"
            />
            <div>
              <h1 className="text-3xl font-bold">{userData.name}</h1>
              <p className="text-gray-600">{userData.email}</p>
              <button
                onClick={() => router.push("/moncompte")}
                className="mt-2 px-3 py-1 bg-yellow-400 rounded-md hover:bg-yellow-500 transition"
              >
                Modifier mon profil
              </button>
            </div>
          </div>

          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="text-center">
              <p>Abonnés</p>
              <p className="font-bold text-xl">{subscribers}</p>
            </div>
            <div className="text-center">
              <p>Vues</p>
              <p className="font-bold text-xl">{totalViews}</p>
            </div>
            <div className="text-center">
              <p>Gains</p>
              <p className={`font-bold text-xl ${subscribers >= 250 ? "text-green-600" : "text-gray-400"}`}>
                ${gains.toFixed(2)}
              </p>
              {subscribers < 250 && <small className="text-gray-500">Monétisation verrouillée (250 abonnés requis)</small>}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Formulaire de publication */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Publier un nouveau texte</h2>
          <form onSubmit={handlePublish} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Titre du texte"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Contenu du texte"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={6}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="URL de l'image (optionnel)"
              value={newImage || ""}
              onChange={(e) => setNewImage(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              {loading ? "Publication..." : "Publier"}
            </button>
          </form>
        </div>

        {/* Liste des textes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Mes textes publiés</h2>
          {texts.length === 0 ? (
            <p>Aucun texte publié pour le moment.</p>
          ) : (
            <ul className="space-y-4">
              {texts.map((text) => (
                <li key={text.id} className="p-4 border rounded-lg hover:shadow transition">
                  <a href={`/bibliotheque/${text.id}`} className="text-blue-600 font-bold hover:underline">{text.title}</a>
                  <p className="text-gray-600">Vues : {text.views || 0}</p>
                  {text.image && <img src={text.image} alt={text.title} className="mt-2 w-full max-w-md rounded-lg" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}              alt="Profil"
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-600"
            />
            <div>
              <h1 className="text-3xl font-bold">{userData.name}</h1>
              <p className="text-gray-600">{userData.email}</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePicChange}
              disabled={uploading}
              className="px-4 py-2 border rounded-md cursor-pointer"
            />
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Formulaire de publication */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Publier un nouveau texte</h2>
          <form onSubmit={handlePublish} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Titre du texte"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Contenu du texte"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={6}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              {loading ? "Publication..." : "Publier"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
    }
