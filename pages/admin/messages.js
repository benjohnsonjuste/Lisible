import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function AdminMessages() {
  const [user, setUser] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Vérification de l'utilisateur connecté et de son rôle
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      // Vérifier le rôle dans Firestore
      const q = query(collection(db, "users"), where("uid", "==", u.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        if (data.role === "admin") {
          setIsAdmin(true);
        } else {
          alert("Accès refusé : vous devez être administrateur.");
          router.push("/");
        }
      } else {
        alert("Utilisateur non trouvé.");
        router.push("/");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // Charger la liste des auteurs
  useEffect(() => {
    if (!isAdmin) return;

    const fetchAuthors = async () => {
      const q = query(collection(db, "users"), where("role", "==", "author"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().uid,
        name: doc.data().name,
      }));
      setAuthors(list);
    };

    fetchAuthors();
  }, [isAdmin]);

  const sendMessage = async () => {
    if (!selectedAuthor || !message.trim()) {
      alert("Veuillez sélectionner un auteur et saisir un message.");
      return;
    }

    try {
      await addDoc(collection(db, "messages"), {
        authorId: selectedAuthor,
        content: message,
        read: false,
        createdAt: serverTimestamp(),
      });
      alert("Message envoyé avec succès !");
      setMessage("");
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      alert("Impossible d'envoyer le message.");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (!isAdmin) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-6 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Envoyer un message à un auteur</h1>

      {/* Sélection de l'auteur */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Sélectionner un auteur</label>
        <select
          value={selectedAuthor}
          onChange={(e) => setSelectedAuthor(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">-- Choisir un auteur --</option>
          {authors.map((author) => (
            <option key={author.uid} value={author.uid}>
              {author.name}
            </option>
          ))}
        </select>
      </div>

      {/* Zone de saisie du message */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 rounded w-full"
          rows="4"
          placeholder="Écrivez votre message ici..."
        ></textarea>
      </div>

      <button
        onClick={sendMessage}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Envoyer
      </button>
    </div>
  );
}