import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

import AuthorStats from "@/components/AuthorStats";
import MonetizationLock from "@/components/MonetizationLock";
import PublishingForm from "@/components/PublishingForm";
import AuthorTextsList from "@/components/AuthorTextsList";
import MonetisationRealTime from "@/components/MonetisationRealTime";
import AuthorProfileForm from "@/components/AuthorProfileForm";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
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

  if (loading) return <p className="text-center mt-8 text-gray-500">Chargement...</p>;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      {/* Section 1 : Profil auteur */}
      <section className="bg-gray-50 p-4 rounded-2xl shadow">
        <AuthorProfileForm authorId={user.uid} />
      </section>

      {/* Section 2 : Statistiques */}
      <section className="bg-gray-50 p-4 rounded-2xl shadow">
        <AuthorStats authorId={user.uid} onFollowersUpdate={setFollowers} />
      </section>

      {/* Section 3 : Monétisation */}
      <section className="bg-gray-50 p-4 rounded-2xl shadow">
        {followers >= 250 ? (
          <MonetisationRealTime authorId={user.uid} />
        ) : (
          <MonetizationLock followers={followers} />
        )}
      </section>

      {/* Section 4 : Formulaire de publication */}
      <section className="bg-gray-50 p-4 rounded-2xl shadow">
        <PublishingForm authorId={user.uid} />
      </section>

      {/* Section 5 : Liste des textes */}
      <section className="bg-gray-50 p-4 rounded-2xl shadow">
        <AuthorTextsList authorId={user.uid} />
      </section>
    </div>
  );
}