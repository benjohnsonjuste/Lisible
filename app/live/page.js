'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const createLive = () => {
    // Génère un ID de salon unique et éphémère
    const streamId = Math.random().toString(36).substring(2, 11);
    router.push(`/live/studio?id=${streamId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Studio Live P2P Éphémère
        </h1>
        <p className="text-gray-400 text-sm">
          Aucun serveur, aucune base de données. Le flux vidéo, les commentaires et les likes transitent directement entre navigateurs et s'effacent instantanément à la fermeture.
        </p>
        <button
          onClick={createLive}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full text-lg shadow-lg shadow-blue-500/20 transition-all transform active:scale-95"
        >
          Lancer mon direct immédiatement
        </button>
      </div>
    </main>
  );
}
