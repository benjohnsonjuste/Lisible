"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Bell, Heart, MessageCircle, FileText } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useUserProfile();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, "notifications"),
          where("recipientId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const notifData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifData);
      } catch (err) {
        console.error("Erreur lors du chargement des notifications :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <div className="animate-pulse">Chargement des notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <Bell className="w-6 h-6 text-blue-600" />
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <p className="text-center text-gray-500">
          Aucune notification pour le moment.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                {n.type === "like" && (
                  <Heart className="w-6 h-6 text-red-500 mt-1" />
                )}
                {n.type === "comment" && (
                  <MessageCircle className="w-6 h-6 text-green-500 mt-1" />
                )}
                {n.type === "text" && (
                  <FileText className="w-6 h-6 text-blue-500 mt-1" />
                )}

                <div>
                  <p className="text-gray-800">
                    {n.message}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}