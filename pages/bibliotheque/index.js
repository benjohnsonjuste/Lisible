import Head from "next/head";
import Library from "@/components/library";

export default function BibliothequePage() {
  return (
    <>
      <Head>
        <title>Bibliothèque</title>
        <meta
          name="description"
          content="Découvrez et explorez les textes disponibles sur Lisible : romans, poésies, nouvelles et bien plus encore."
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-10 px-4">
          {/* En-tête de la bibliothèque */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Bibliothèque
            </h1>
            <p className="text-gray-600 text-lg">
              Explorez les textes, romans, poésies et publications des auteurs de la communauté.
            </p>
          </div>

          {/* Composant library */}
          <Library />
        </div>
      </div>
    </>
  );
}