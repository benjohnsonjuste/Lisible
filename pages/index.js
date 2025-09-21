// pages/index.js
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        Bienvenue sur Lisible 📚
      </h1>
      <p className="text-gray-600 max-w-md">
        Découvrez, lisez et publiez vos propres textes dans notre bibliothèque en
        ligne.
      </p>
    </div>
  );
}