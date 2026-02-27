"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HostStudio() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Liste stricte des administrateurs autorisés
  const ADMINS = [
    "adm.lablitteraire7@gmail.com", 
    "woolsleypierre01@gmail.com", 
    "jeanpierreborlhaïniedarha@gmail.com", 
    "robergeaurodley97@gmail.com", 
    "jb7management@gmail.com", 
    "cmo.lablitteraire7@gmail.com"
  ];

  useEffect(() => {
    const checkAccess = () => {
      const storedUser = localStorage.getItem("lisible_user");
      
      if (!storedUser) {
        router.push("/club"); // Pas connecté -> Redirection
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        if (ADMINS.includes(user.email?.toLowerCase())) {
          setIsAdmin(true);
          setLoading(false);
        } else {
          router.push("/club"); // Pas admin -> Redirection
        }
      } catch (e) {
        router.push("/club");
      }
    };

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Vérification des accréditations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <Link href="/club" className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            <ArrowLeft size={16} /> Quitter le studio
          </Link>
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
            <ShieldAlert size={14} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Mode Administrateur</span>
          </div>
        </header>

        <h1 className="text-5xl font-black italic tracking-tighter mb-4">Studio de Diffusion<span className="text-blue-600">.</span></h1>
        <p className="text-slate-400 mb-12 text-lg">Préparez votre plume, le monde vous écoute.</p>

        {/* C'est ici que vous placerez vos composants de contrôle de live (Audio/Vidéo) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 hover:border-blue-500/50 transition-all">
            <h3 className="text-xl font-bold mb-4">Paramètres du Direct</h3>
            <div className="space-y-4">
               {/* Formulaires pour le titre, type de live, etc. */}
               <p className="text-xs text-slate-500 italic">Interface de configuration prête.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
