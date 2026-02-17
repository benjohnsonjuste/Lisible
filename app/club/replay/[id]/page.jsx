"use client";
import { useEffect, useState } from "react";
import ReplayPlayer from "@/components/ReplayPlayer";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ReplayRoom({ params }) {
  const [replayData, setReplayData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getArchive() {
      // On utilise le type live-sync car l'ID reste le même, 
      // mais GitHub renverra le JSON avec isActive: false et le transcript
      const res = await fetch(`/api/github-db?type=live-sync&id=${params.id}`);
      const data = await res.json();
      if (data && data.content) {
        setReplayData(data.content);
      }
      setLoading(false);
    }
    getArchive();
  }, [params.id]);

  if (loading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-mono text-xs uppercase tracking-[0.5em]">
      Chargement de l'archive...
    </div>
  );

  if (!replayData) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
      <h2 className="text-2xl font-serif italic mb-6">Archive introuvable</h2>
      <Link href="/club" className="text-blue-500 flex items-center gap-2 font-bold uppercase text-[10px]">
        <ChevronLeft size={14}/> Retour au Club
      </Link>
    </div>
  );

  return (
    <main className="h-screen w-full overflow-hidden">
      {/* Bouton retour flottant pour ne pas casser l'immersion */}
      <Link 
        href="/club" 
        className="fixed top-6 left-6 z-[600] bg-white/5 hover:bg-white/10 backdrop-blur-xl p-3 rounded-2xl border border-white/10 text-white transition-all shadow-2xl"
      >
        <ChevronLeft size={20} />
      </Link>

      <ReplayPlayer replayData={replayData} />
    </main>
  );
}
