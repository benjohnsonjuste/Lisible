// pages/lisible-club.js
import LisibleClubDashboard from "@/components/LisibleClubDashboard";
import LisibleClubViewer from "@/components/LisibleClubViewer";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

export default function LisibleClubPage() {
  const [user, setUser] = useState<User | null>(null);
  const [newPostAlert, setNewPostAlert] = useState(false);

  // 🔹 Récupérer l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 🔹 Préparer l'objet author pour le Dashboard
  const author = user
    ? {
        id: user.uid,
        name: user.displayName || "Auteur inconnu",
        email: user.email,
      }
    : null;

  // 🔹 Notification visuelle de nouveau post
  const handleNewPost = () => {
    setNewPostAlert(true);
    setTimeout(() => setNewPostAlert(false), 5000); // disparaît après 5s
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Lisible Club</h1>

      {/* Notification de nouveau post */}
      {newPostAlert && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-bounce">
          Nouveau post publié !
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Dashboard / Formulaire de publication */}
        <div className="lg:w-1/3">
          <LisibleClubDashboard author={author} onNewPost={handleNewPost} />
        </div>

        {/* Feed / Viewer */}
        <div className="lg:w-2/3">
          <LisibleClubViewer />
        </div>
      </div>
    </div>
  );
}