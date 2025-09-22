// pages/moncompte.js
import { useState, useEffect } from "react";
import { auth, db, updateDoc, doc, getDoc } from "../firebaseConfig";

export default function MonCompte() {
  const [userData, setUserData] = useState(null);
  const [photoURL, setPhotoURL] = useState("");
  const DEFAULT_AVATAR = "/avatar.png";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData({ uid: user.uid, ...userDoc.data() });
          setPhotoURL(userDoc.data().photoURL || DEFAULT_AVATAR);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSavePhoto = async () => {
    if (!photoURL) return alert("Entrez un lien valide.");
    await updateDoc(doc(db, "users", userData.uid), { photoURL });
    alert("Photo mise à jour !");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mon Compte</h1>

      <img
        src={photoURL}
        alt="Profil"
        className="w-24 h-24 rounded-full object-cover border-2 mb-4"
      />

      <input
        type="text"
        placeholder="Lien de votre photo de profil"
        value={photoURL}
        onChange={(e) => setPhotoURL(e.target.value)}
        className="border w-full p-2 rounded mb-2"
      />

      <button
        onClick={handleSavePhoto}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Sauvegarder
      </button>
    </div>
  );
    }
