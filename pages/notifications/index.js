"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const q = query(
      collection(db, "users", session.user.id, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [session?.user?.id]);

  const markAsRead = async (notifId, link) => {
    if (!session?.user?.id) return;
    const notifRef = doc(db, "users", session.user.id, "notifications", notifId);
    await updateDoc(notifRef, { read: true });

    if (link) router.push(link);
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Connectez-vous pour voir vos notifications.</p>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500">Vous n'avez aucune notification pour le moment.</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow mt-10">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => markAsRead(notif.id, notif.link)}
            className={`p-4 rounded-xl shadow cursor-pointer transition ${
              notif.read ? "bg-gray-100" : "bg-blue-600 text-white"
            }`}
          >
            <h4 className="font-bold">{notif.title}</h4>
            <p className="text-sm">{notif.message}</p>
            {notif.link && <p className="text-xs text-gray-200 mt-1">Cliquez pour voir</p>}
          </div>
        ))}
      </div>
    </main>
  );
}
