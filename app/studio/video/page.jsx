import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import StudioVideo from "@/components/studio-video/StudioVideo";

export const metadata = {
  title: "Studio Vidéo — Transformez votre texte en vidéo | Lisible",
  description:
    "Créez en quelques clics une vidéo verticale de votre texte (voix, musique, QR code) prête pour TikTok, Reels et Shorts. Gratuit, rendu dans votre navigateur.",
};

export default function StudioVideoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Suspense
        fallback={
          <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-400" />
            <p className="text-xs font-bold uppercase tracking-widest">Chargement du studio…</p>
          </div>
        }
      >
        <StudioVideo />
      </Suspense>
    </main>
  );
}
