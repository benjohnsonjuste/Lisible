import CadeauLi from "@/components/CadeauLi"; // Ajustez le chemin selon votre structure

export const metadata = {
  title: "Offrir des Li | Lisible",
  description: "Partagez votre énergie avec les autres plumes de la communauté.",
};

export default function GiftPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] py-12 px-4 flex flex-col items-center justify-center">
      {/* Header de la page */}
      <div className="max-w-md w-full mb-10 text-center">
        <h1 className="text-4xl font-black italic text-slate-900 tracking-tighter mb-3">
          L'Atelier des Cadeaux
        </h1>
        <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
          Un geste simple pour soutenir une plume, encourager une lecture ou partager la force de vos Li.
        </p>
      </div>

      {/* Le composant de transfert */}
      <div className="w-full">
        <CadeauLi />
      </div>

      {/* Footer / Info supplémentaire */}
      <footer className="mt-12 max-w-xs text-center">
        <div className="inline-block p-1 px-3 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Note de sécurité
        </div>
        <p className="text-[11px] text-slate-400 leading-normal italic">
          Chaque transfert est définitif et enregistré sur le registre de l'Atelier. Assurez-vous d'avoir sélectionné la bonne plume avant d'envoyer votre cadeau.
        </p>
      </footer>
    </main>
  );
}
