// components/DashboardHeader.jsx
import Link from "next/link";

export default function DashboardHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Tableau de bord Auteur</h1>
      <Link href="/moncompte">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Modifier mon profil
        </button>
      </Link>
    </div>
  );
}