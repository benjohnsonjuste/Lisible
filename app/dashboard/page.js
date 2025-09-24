"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import MetricsCard from "@/components/MetricsCard";
import PublishingForm from "@/components/PublishingForm";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <MetricsCard />
      <PublishingForm />
    </div>
  );
}
