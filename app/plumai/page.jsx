import ManuscriptAnalyzer from '@/components/ManuscriptAnalyzer';

export default function PlumaiPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-between">
      {/* Intégration de votre module d'analyse stylistique */}
      <div className="py-8">
        <ManuscriptAnalyzer />
      </div>
    </main>
  );
}
