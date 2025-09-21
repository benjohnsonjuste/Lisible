// pages/dashboard/index.js
import { useEffect, useState } from "react";
import { auth } from "../../firebaseConfig";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user ? (
        <p className="mt-2 text-gray-600">Bienvenue, {user.displayName || user.email} !</p>
      ) : (
        <p className="mt-2 text-gray-500">Chargement...</p>
      )}
    </div>
  );
}