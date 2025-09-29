// components/NotificationBell.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Bell } from "lucide-react"; // ✅ Import correct pour l'icône

export default function NotificationBell() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState(null);

  // ✅ Récupère l'utilisateur connecté
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Écoute Firestore en temps réel
  useEffect(() => {
    if (!userId) return;

    const notifRef = collection(db, "notifications");
    const q = query(notifRef, where("recipientId", "==", userId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unreadCount = snapshot.docs.filter((doc) => !doc.data().read).length;
      setCount(unreadCount);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div
      className="relative cursor-pointer"
      onClick={() => router.push("/notifications")}
    >
      {/* Icône cloche */}
      <Bell className="w-8 h-8 text-white hover:text-blue-300 transition" />

      {/* Badge rouge si notifications non lues */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </div>
  );
}
