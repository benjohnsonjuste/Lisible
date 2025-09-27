import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, collection, onSnapshot, query, where, updateDoc } from "firebase/firestore";
import MonetizationRealtime from "@/components/MonetizationRealtime"; // ton composant monétisation
import Link from "next/link";

export default function Dashboard() {
  const user = auth.currentUser;
  const [authorData, setAuthorData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les infos de l'auteur
  useEffect(() => {
    if (!user) return;

    const authorRef = doc(db, "authors", user.uid);
    const unsubscribeAuthor = onSnapshot(authorRef, (docSnap) => {
      if (docSnap.exists()) {
        setAuthorData({ id: docSnap.id, ...docSnap.data() });
      }
    });

    return () => unsubscribeAuthor();
  }, [user]);

  // Charger les messages des opérateurs
  useEffect(() => {
    if (!user) return;

    const messagesQuery = query(
      collection(db, "operatorMessages"),
      where("authorId", "==", user.uid)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (querySnap) => {
      const msgs = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setUnreadCount(msgs.filter(m => !m.read).length);
    });

    return () => unsubscribeMessages();
  }, [user]);

  const markAsRead = async (msgId) => {
    await updateDoc(doc(db, "operatorMessages", msgId), { read: true });
  };

  if (!user) return <p>Veuillez vous connecter pour accéder au dashboard.</p>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header avec cloche de notification */}
      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold">Dashboard de {authorData?.fullName || "Auteur"}</h1>
        <div className="relative">
          <Link href="#messages">
            <a>
              <img src="/bell.svg" alt="Notifications" className="w-8 h-8 cursor-pointer"/>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </a>
          </Link>
        </div>
      </div>

      {/* Monétisation activée si >= 250 abonnés */}
      {authorData?.subscribers?.length >= 250 && <MonetizationRealtime />}

      {/* Messages des opérateurs */}
      <div id="messages" className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Messages des opérateurs</h2>
        {messages.length === 0 ? (
          <p>Aucun message pour le moment.</p>
        ) : (
          <ul className="space-y-3 max-h-80 overflow-y-auto">
            {messages.map(msg => (
              <li key={msg.id} className={`border p-3 rounded ${msg.read ? "bg-gray-100" : "bg-yellow-50"}`}>
                <p className="font-semibold">{msg.title}</p>
                <p>{msg.content}</p>
                {!msg.read && (
                  <button
                    onClick={() => markAsRead(msg.id)}
                    className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Marquer comme lu
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Liens rapides pour gérer textes */}
      <div className="bg-white p-6 rounded shadow flex gap-4">
        <Link href="/publier">
          <a className="bg-green-600 text-white px-4 py-2 rounded">Publier un texte</a>
        </Link>
        <Link href="/mes-textes">
          <a className="bg-blue-600 text-white px-4 py-2 rounded">Mes textes</a>
        </Link>
      </div>
    </div>
  );
}
