import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

import AuthorStats from "@/components/AuthorStats";
import MonetizationLock from "@/components/MonetizationLock";
import PublishingForm from "@/components/PublishingForm";
import AuthorTextsList from "@/components/AuthorTextsList";
import MonetisationRealTime from "@/components/MonetisationRealTime";
import AuthorProfileForm from "@/components/AuthorProfileForm"

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0); // Stocker le nombre d'abonnés
  const router = useRouter();

  // Vérification de l'état d'authentification
  useEffect(() => {
    if (!router.isReady) return;

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

  // Affichage pendant le chargement
  if (loading) {
    return <p className="text-center mt-8 text-gray-500">Chargement...</p>;
  }

  // Si l'utilisateur n'est pas authentifié
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      {/* Statistiques de l'auteur - récupère le nombre de followers */}
      <AuthorStats authorId={user.uid} onFollowersUpdate={setFollowers} />

      {/* Monétisation */}
      <div className="my-6">
        {followers >= 250 ? (
          <MonetisationRealTime authorId={user.uid} />
        ) : (
          <MonetizationLock followers={followers} />
        )}
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