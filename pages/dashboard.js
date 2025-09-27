import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

import AuthorStats from "@/components/AuthorStats";
import MonetizationLock from "@/components/MonetizationLock";
import PublishingForm from "@/components/PublishingForm";
import AuthorTextsList from "@/components/AuthorTextsList";
import MonetizationRealtime from "@/components/MonetizationRealtime";
import MessagesAuteur from "@/components/MessagesAuteur";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="p-4">
      {/* Header avec cloche de notifications */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <MessagesAuteur />
      </div>

      {/* Statistiques générales de l'auteur */}
      <AuthorStats authorId={user.uid} />

      {/* Monétisation */}
      <MonetizationRealtime />

      {/* Monétisation verrouillée si moins de 250 abonnés */}
      <MonetizationLock followers={0} />

      {/* Formulaire de publication */}
      <PublishingForm authorId={user.uid} />

      {/* Liste des textes publiés */}
      <AuthorTextsList authorId={user.uid} />
    </div>
  );
}