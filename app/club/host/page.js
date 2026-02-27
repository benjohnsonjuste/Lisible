"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import LiveSystem from "@/components/LiveSystem"; // Importation du composant de streaming

export default function HostStudio() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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
        router.push("/club"); 
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        if (ADMINS.includes(user.email?.toLowerCase())) {
          setCurrentUser(user);
          setIsAdmin(true);
          setLoading(false);
        } else {
          router.push("/club"); 
        }
      } catch (e) {
        router.push("/club");
      }
    };

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <Loader2 className="animate-spin text-teal-500 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Ouverture du Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9] dark:bg-slate-950 transition-colors duration-500 pb-20">
      {/* HEADER DU STUDIO */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/5 px-8 py-6 mb-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <Link href="/club" className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:scale-110 transition-transform">
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter dark:text-white leading-none">
                Studio de Diffusion<span className="text-teal-500">.</span>
              </h1>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Interface de contrôle Lisible</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-3 bg-teal-500/10 border border-teal-500/20 px-5 py-2.5 rounded-full">
                <ShieldAlert size={14} className="text-teal-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-500">Accréditation Admin OK</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden">
                <img src={currentUser?.image || currentUser?.profilePic || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name}`} alt="Avatar" />
             </div>
          </div>
        </div>
      </div>

      {/* COMPOSANT LIVE (LOGIQUE DE STREAMING) */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <LiveSystem currentUser={currentUser} isAdmin={true} />
      </div>

      {/* FOOTER INFO */}
      <div className="max-w-5xl mx-auto px-8 mt-12">
        <div className="bg-blue-600/5 border border-blue-500/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-blue-500 rounded-2xl text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Conseil de diffusion</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Pour une meilleure qualité, assurez-vous d'avoir une connexion stable. Les commentaires des auditeurs apparaîtront directement sur l'écran pendant votre direct.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
