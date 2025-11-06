"use client";

import { useEffect, useState } from "react";
import { getNotifications, clearNotifications } from "@/lib/notifications";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const stored = getNotifications();
    setNotifications(stored);
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow mt-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button
          onClick={() => {
            clearNotifications();
            setNotifications([]);
          }}
          className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Tout effacer
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center">Aucune notification pour l’instant.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="p-3 border rounded hover:bg-gray-50 transition"
            >
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-gray-700">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.date).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}