"use client";
import { useState, useEffect } from "react";
import MarketplaceList from "@/components/MarketplaceList";
import CreateTaskModal from "@/components/CreateTaskModal";
import { Plus, LayoutGrid, Search } from "lucide-react";

export default function MarketplacePage() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const logged = localStorage.getItem("lisible_user");
    if (logged) setUser(JSON.parse(logged));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen bg-[#FCFBF9]">
      {/* Header Marketplace */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">Atelier des Services</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Échangez vos talents contre des Li</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black hover:scale-105 transition-all shadow-lg"
        >
          <Plus size={20} /> Publier une mission
        </button>
      </header>

      {/* Barre de recherche et filtres */}
      <div className="flex gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un correcteur, poète..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none font-medium"
          />
        </div>
      </div>

      {/* Liste des missions */}
      <MarketplaceList 
        user={user} 
        refreshTrigger={refreshTrigger} 
        onAction={() => setRefreshTrigger(prev => prev + 1)} 
      />

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute -top-12 right-0 text-white font-bold hover:text-teal-200"
            > Fermer </button>
            <CreateTaskModal 
              user={user} 
              refreshTasks={() => {
                setRefreshTrigger(prev => prev + 1);
                setShowModal(false);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
