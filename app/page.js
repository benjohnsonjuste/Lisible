import HeaderCover from "@/components/HeaderCover";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <HeaderCover />
      <section className="container py-8">
        <h2 className="text-2xl font-bold mb-4">Derniers textes</h2>
        <p className="text-gray-600">Découvre les œuvres des auteurs et soutiens-les en t'abonnant.</p>
        <div className="mt-6">
          <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded">Aller au dashboard</Link>
        </div>
      </section>
    </main>
  );
}
