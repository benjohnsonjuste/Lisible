import { useEffect, useState } from "react";
import FollowButton from "@/components/FollowButton";

export default function AuteurPage({ params }) {
  const { uid } = params;
  const [auteur, setAuteur] = useState(null);

  useEffect(() => {
    async function fetchAuteur() {
      const res = await fetch(`/api/get-user?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setAuteur(data);
      }
    }
    fetchAuteur();
  }, [uid]);

  if (!auteur) return <p>Chargement...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold">{auteur.name}</h1>
      <p className="text-gray-600 mb-4">{auteur.bio || "Auteur Lisible"}</p>
      <FollowButton authorUid={uid} currentUser={null /* à remplacer par le user connecté */} />
      <p className="mt-4 text-sm text-gray-500">
        {auteur.subscribers?.length || 0} abonnés
      </p>
    </div>
  );
}
