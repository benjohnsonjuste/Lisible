import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

import AuthorStats from "@/components/AuthorStats";
import MonetizationLock from "@/components/MonetizationLock";
import PublishingForm from "@/components/PublishingForm";
import AuthorTextsList from "@/components/AuthorTextsList";
import MonetisationRealTime from
"@/components/MonetisationRealTime";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // État pour le chargement
  const router = useRouter();

  useEffect(() => {
    // Écoute les changements d'état de l'authentification
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Affichage pendant le chargement initial
  if (loading) {
    return <p className="text-center mt-8 text-gray-500">Chargement...</p>;
  }

  // Si l'utilisateur n'est pas authentifié (redirigé)
  if (!user) {
    return null; // Empêche le rendu de la page
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      {/* Statistiques de l'auteur */}
      <AuthorStats authorId={user.uid} />

      {/* Monétisation (par défaut followers à 0, peut être relié à AuthorStats) */}
      <div className="my-6">
        <MonetizationLock followers={0} />
      </div>

      {/* Formulaire de publication */}
      <PublishingForm authorId={user.uid} />

      {/* Liste des textes publiés */}
      <div className="mt-8">
        <AuthorTextsList authorId={user.uid} />
      </div>
    </div>
  );
}