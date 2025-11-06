"use client";

import { useEffect, useState } from "react";
import { getPublicNotifications, getUserNotifications } from "@/lib/notifications";
import { useAuth } from "@/context/AuthContext";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const publicNotifs = getPublicNotifications();
    const userNotifs = getUserNotifications(user.uid);

    setNotifications([...publicNotifs, ...userNotifs].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    ));
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Connecte-toi pour voir tes notifications.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-center text-gray-500">
          Aucune notification pour le moment.
        </p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
            >
              <p className="font-semibold text-gray-800">{n.title}</p>
              <p className="text-gray-600">{n.message}</p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(n.date).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}