"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function NotificationCenter({ userId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notifId) => {
    const notifRef = doc(db, "users", userId, "notifications", notifId);
    await updateDoc(notifRef, { read: true });
  };

  if (!notifications.length) return null;

  return (
    <div className="fixed top-16 right-4 z-50 w-80 max-h-[80vh] overflow-y-auto space-y-2">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => markAsRead(notif.id)}
          className={`p-3 rounded-lg shadow cursor-pointer transition ${
            notif.read ? "bg-gray-100" : "bg-blue-600 text-white"
          }`}
        >
          <h4 className="font-bold">{notif.title}</h4>
          <p className="text-sm">{notif.message}</p>
        </div>
      ))}
    </div>
  );
}