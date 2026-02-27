"use client";
import { useEffect, useState } from "react";
import ReplayPlayer from "@/components/ReplayPlayer";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function ReplayRoom({ params }) {
  const [replayData, setReplayData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getArchive() {
      try {
        // Adaptation : On interroge l'API dédiée pour récupérer les données archivées
        const res = await fetch(`/api/live`);
        const data = await res.json();
        
        // On vérifie si l'ID de la room correspond et si le contenu est prêt pour le replay
        if (data && data.roomID === params.id) {
          setReplayData(data);
        }
      } catch (e) {
        console.error("Erreur lors de la récupération de l'archive");
      } finally {
        setLoading(false);
      }
    }
    getArchive();
  }, [params.id]);

  if (loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
      <span className="font-black text-[10px] uppercase tracking-[0.4em] opacity-50">Récupération des écrits...</span>
    </div>
  );

  if (!replayData) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-6 text-center">
      <h2 className="text-4xl font-black italic tracking-tighter mb-6">Archive introuvable<span className="text-blue-600">.</span></h2>
      <p className="text-slate-400 text-sm max-w-sm mb-10 leading-relaxed">
        Cette session n'existe plus ou le lien a été corrompu. La mémoire du Club est vaste, mais parfois sélective.
      </p>
      <Link href="/club" className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all">
        <div className="flex items-center gap-2">
          <ChevronLeft size={16}/> Retour au Club
        </div>
      </Link>
    </div>
  );

  return (
    <main className="h-screen w-full overflow-hidden bg-black relative">
      {/* Bouton retour flottant minimaliste */}
      <Link 
        href="/club" 
        className="fixed top-8 left-8 z-[600] bg-white/5 hover:bg-white/10 backdrop-blur-2xl p-4 rounded-[1.5rem] border border-white/10 text-white transition-all shadow-2xl group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </Link>

      <ReplayPlayer replayData={replayData} />
    </main>
  );
}
