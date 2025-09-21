import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { auth, db, storage } from "../firebaseConfig";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);

  const DEFAULT_AVATAR = "/avatar.png"; // mettre avatar.png dans public/

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData({ uid: user.uid, ...userDoc.data() });
          setProfilePic(userDoc.data().photoURL || DEFAULT_AVATAR);
        }
      } else {
        router.push("/login");
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
        authorId: userData.uid,
        authorName: userData.name,
        createdAt: serverTimestamp(),
      });
      setNewTitle("");
      setNewContent("");
      alert("Texte publié avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la publication.");
    }
    setLoading(false);
  };

  // Mettre à jour la photo de profil
  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profilePics/${userData.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Mettre à jour dans Firebase Auth
      await updateProfile(auth.currentUser, { photoURL });
      // Mettre à jour dans Firestore
      await updateDoc(doc(db, "users", userData.uid), { photoURL });

      setProfilePic(photoURL);
      alert("Photo de profil mise à jour !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'upload.");
    }
    setUploading(false);
  };

  if (!userData) {
    return (
      <Layout>
        <div className="text-center mt-24 text-gray-600">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-xl">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profilePic}
              alt="Profil"
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
