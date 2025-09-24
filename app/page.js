import couverture from "@/public/couverture";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <couverture />
      <section className="container py-8">
        <h2 className="text-2xl font-bold mb-4">Derniers textes</h2>
        <p className="text-gray-600">Publiez dès maintenant en créant un compte.</p>
        <div className="mt-6">
          <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">Inscription</Link>
        </div>
      </section>
    </main>
  );
}
