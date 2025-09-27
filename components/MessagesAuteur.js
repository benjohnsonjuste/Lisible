import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc as firestoreDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function MessagesAuteur() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Vérifie l'état de l'utilisateur connecté
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  // Écoute les messages de l'auteur connecté
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "messages"), where("authorId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }));
      setMessages(data);

      // Compte les messages non lus
      const unread = data.filter((msg) => msg.read === false).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  // Marquer un message comme lu
  const markAsRead = async (msgId) => {
    try {
      const msgRef = firestoreDoc(db, "messages", msgId);
      await updateDoc(msgRef, { read: true });
    } catch (e) {
      console.error("Erreur lors du marquage comme lu :", e);
    }
  };

  return (
    <div className="relative">
      {/* Cloche de notification */}
      <div className="cursor-pointer relative" onClick={() => setOpen(!open)}>
        <img src="/notification.svg" alt="Notifications" className="w-8 h-8" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
            {unreadCount}
          </span>
        )}
      </div>

      {/* Menu déroulant des messages */}
      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-white border shadow-lg rounded-lg z-50">
          <h3 className="p-3 font-bold border-b">Messages</h3>
          <div className="max-h-64 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="p-3 text-gray-500 text-sm">Aucun message.</p>
            ) : (
              messages.map((msg) => {
                const date =
                  msg.createdAt?.seconds
                    ? new Date(msg.createdAt.seconds * 1000).toLocaleString()
                    : "Date inconnue";

                return (
                  <div
                    key={msg.id}
                    className={`p-3 border-b cursor-pointer ${
                      msg.read ? "bg-gray-50" : "bg-blue-50"
                    }`}
                    onClick={() => markAsRead(msg.id)}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs text-gray-500">{date}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}