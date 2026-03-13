"use client";
import { useState, useEffect } from 'react';
import LanceurDeSignaux from '@/components/LanceurDeSignaux';
import { Lock, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
};

export default function AdminSignauxPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [allEmails, setAllEmails] = useState([]);

  // Récupération de la liste de TOUS les inscrits depuis data/users
  const fetchAllUsers = async () => {
    try {
      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/users`;
      const res = await fetch(url);
      if (res.ok) {
        const files = await res.json();
        // On transforme les noms de fichiers (ex: nom_prenom.json) en emails lisibles
        const emails = files
          .filter(f => f.name.endsWith('.json'))
          .map(f => f.name.replace('.json', '').replace(/_/g, '.'));
        setAllEmails(emails);
      }
    } catch (err) {
      console.error("Erreur récupération utilisateurs:", err);
    }
  };

  const checkAuth = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'broadcast', 
          adminToken: password,
          message: "Vérification staff",
          type: "info",
          dryRun: true 
        })
      });

      if (res.ok) {
        sessionStorage.setItem('admin_access_token', password);
        await fetchAllUsers(); 
        setIsAuthenticated(true);
        setError(false);
      } else {
        setError(true);
        setPassword("");
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FCFBF9] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter mb-2">Accès Staff.</h1>
          <form onSubmit={checkAuth} className="space-y-4">
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-5 bg-slate-50 rounded-2xl text-center font-bold border-2 transition-all ${error ? 'border-rose-500' : 'border-transparent focus:border-teal-500'}`}
              placeholder="Code d'accès"
            />
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black disabled:opacity-50">
              {isVerifying ? "Vérification..." : "Déverrouiller"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFBF9] p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-16">
          <Link href="/dashboard" className="p-4 bg-white rounded-[1.2rem] border border-slate-100 shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 rounded-full border border-teal-100">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Admin Authentifié</span>
            </div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
              Base de données : {allEmails.length} utilisateurs trouvés
            </span>
          </div>
        </header>

        <div className="flex justify-center">
          <LanceurDeSignaux targets={allEmails} />
        </div>
      </div>
    </div>
  );
}
