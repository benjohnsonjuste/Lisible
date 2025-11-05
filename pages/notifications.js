"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { user, isLoading: userLoading } = useUserProfile();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const notifList = [];

        // 1️⃣ Tous les textes publiés
        const textsSnap = await getDocs(
          query(collection(db, "texts"), orderBy("date", "desc"))
        );

        // Pour chaque texte publié
        textsSnap.forEach((docText) => {
          const data = docText.data();

          // Texte publié par d'autres utilisateurs
          if (data.authorEmail !== user.email) {
            notifList.push({
              id: docText.id + "_texte",
              type: "nouveau_texte",
              textId: docText.id,
              title: data.title,
              authorName: data.authorName,
              date: data.date,
              read: data.readBy?.includes(user.uid) || false,
              message: `📄 "${data.title}" publié par ${data.authorName}`,
            });
          }

          // Commentaires sur mes textes
          if (data.authorEmail === user.email) {
            (data.comments || []).forEach((c, idx) => {
              if (c.uid !== user.uid) {
                notifList.push({
                  id: docText.id + "_comment_" + idx,
                  type: "nouveau_commentaire",
                  textId: docText.id,
                  comment: c.content,
                  authorName: c.fullName || c.name || "Utilisateur",
                  date: c.date,
                  read: c.readBy?.includes(user.uid) || false,
                  message: `💬 ${c.fullName || c.name || "Utilisateur"} a commenté votre texte "${data.title}"`,
                });
              }
            });

            // Likes sur mes textes
            (data.likes || []).forEach((l, idx) => {
              if (l.uid !== user.uid) {
                notifList.push({
                  id: docText.id + "_like_" + idx,
                  type: "nouveau_like",
                  textId: docText.id,
                  authorName: l.name || "Utilisateur",
                  date: l.date || data.date,
                  read: l.readBy?.includes(user.uid) || false,
                  message: `❤️ ${l.name || "Utilisateur"} a liké votre texte "${data.title}"`,
                });
              }
            });
          }
        });

        notifList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(notifList);
      } catch (err) {
        console.error("Erreur lors du chargement des notifications :", err);
        toast.error("Impossible de charger les notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  // Marquer notification comme lue
  const markAsRead = async (notif) => {
    try {
      // Mise à jour dans Firestore pour texte ou commentaire
      const textRef = doc(db, "texts", notif.textId);
      const textSnap = await getDocs(textRef);

      // Ici on simplifie : on peut ajouter un tableau readBy[] dans chaque texte/commentaire
      // Pour la démonstration on mettra read = true localement
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error("Erreur pour marquer comme lu:", err);
      toast.error("Impossible de marquer la notification comme lue");
    }
  };

  // Naviguer vers le texte
  const goToText = (textId) => {
    router.push(`/texts/${textId}`);
  };

  if (userLoading || loading)
    return (
      <p className="text-center mt-10 text-gray-600">Chargement des notifications...</p>
    );

  if (!user)
    return (
      <p className="text-center mt-10 text-gray-600">
        Connectez-vous pour voir vos notifications.
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-center">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-center text-gray-500">Aucune notification pour l’instant.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`p-4 border rounded-xl shadow flex justify-between items-center transition ${
                n.read ? "bg-gray-50 text-gray-500" : "bg-white font-medium"
              } hover:bg-gray-100`}
            >
              <div>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.date).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n)}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Marquer lu
                  </button>
                )}
                <button
                  onClick={() => goToText(n.textId)}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Voir le texte
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}