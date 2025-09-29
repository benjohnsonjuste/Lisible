// pages/notifications.js
import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(fetched);

      // Marquer toutes les notifs comme lues
      fetched.forEach(n => {
        if (!n.isRead) {
          updateDoc(doc(db, "notifications", n.id), { isRead: true });
        }
      });
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-gray-500">Aucune notification pour le moment.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li key={notif.id} className="p-4 bg-white rounded-lg shadow hover:bg-gray-100">
              <p className="font-medium">{notif.title}</p>
              <p className="text-sm text-gray-600">{notif.message}</p>
              <p className="text-xs text-gray-400">
                {new Date(notif.createdAt.toDate()).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}