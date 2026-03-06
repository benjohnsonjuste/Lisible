"use client";
import React, { useState, useEffect } from "react";
import { 
  Sword, UserPlus, Check, X, Loader2, 
  Search, ShieldAlert, Zap, Flame, Trophy 
} from "lucide-react";
import { toast } from "sonner";

export default function DuelManager({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // 1. Chargement des utilisateurs depuis l'API (avec harmonisation des emails)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/github-db?type=publications");
        if (res.ok) {
          const data = await res.json();
          // Exclusion des administrateurs et du profil actuel
          const admins = ["cmo.lablitteraire7@gmail.com", "admin@lisible.biz"];
          
          const mappedUsers = data.content.map(u => ({
            ...u,
            // Harmonisation pour l'API duel-engine
            email: u.email || u.authorEmail,
            name: u.penName || u.author || u.name
          }));

          const filtered = mappedUsers.filter(u => 
            u.email &&
            u.email !== currentUser?.email && 
            !admins.includes(u.email) &&
            u.status !== "deleted"
          );
          setUsers(filtered);
        }
      } catch (e) {
        toast.error("L'annuaire des guerriers est inaccessible.");
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.email) fetchUsers();
  }, [currentUser]);

  // 2. Envoyer un défi
  const handleSendChallenge = async (target) => {
    const targetEmail = target.email || target.authorEmail;
    
    if (!targetEmail) {
      return toast.error("Impossible de récupérer l'adresse de cet auteur.");
    }

    setActionLoading(targetEmail);
    const t = toast.loading(`Provocation de ${target.name}...`);
    
    try {
      const res = await fetch("/api/duel-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendChallenge",
          senderEmail: currentUser.email,
          senderName: currentUser.penName || currentUser.name,
          targetEmail: targetEmail
        })
      });

      if (res.ok) {
        toast.success("Gant jeté ! Attendez sa réponse.", { id: t });
      } else {
        const err = await res.json();
        toast.error(err.error || "Le défi n'a pu être porté.", { id: t });
      }
    } catch (e) {
      toast.error("Erreur de liaison avec l'Arène.", { id: t });
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Répondre à une invitation (Accepter/Refuser)
  const handleResponse = async (requestId, responseAction) => {
    setActionLoading(requestId);
    const t = toast.loading("Transmission de votre réponse...");

    try {
      const res = await fetch("/api/duel-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: responseAction,
          requestId,
          email: currentUser.email
        })
      });

      if (res.ok) {
        const msg = responseAction === "acceptChallenge" 
          ? "Duel accepté. Préparez votre encre pour dimanche !" 
          : "Défi décliné avec élégance.";
        toast.success(msg, { id: t });
        
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error();
      }
    } catch (e) {
      toast.error("Le message s'est perdu dans la mêlée.", { id: t });
    } finally {
      setActionLoading(null);
    }
  };

  // Filtrage par recherche
  const filteredUsers = users.filter(u => 
    (u.penName || u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* SECTION : INVITATIONS REÇUES */}
      {currentUser?.duelRequests?.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 px-6">
            <Zap className="text-rose-500 fill-rose-500" size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Défis en attente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-0">
            {currentUser.duelRequests.map((req) => (
              <div key={req.id} className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 font-black">
                    {req.fromName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-rose-500 uppercase mb-0.5 tracking-tighter">Nouvelle provocation</p>
                    <p className="text-white font-bold text-sm">{req.fromName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleResponse(req.id, "acceptChallenge")}
                    disabled={actionLoading === req.id}
                    className="p-3 bg-teal-500 text-slate-950 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
                  >
                    {actionLoading === req.id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  </button>
                  <button 
                    onClick={() => handleResponse(req.id, "declineChallenge")}
                    disabled={actionLoading === req.id}
                    className="p-3 bg-white/5 text-white rounded-full hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION : LISTE DES INSCRITS */}
      <div className="bg-white rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 flex items-center gap-3">
              L'Annuaire <Sword className="text-rose-600" />
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Défiez n'importe quelle plume inscrite</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Chercher un auteur..."
              className="pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-rose-500 w-full md:w-72 transition-all outline-none"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="col-span-full py-24 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-rose-500" size={32} />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Lecture des parchemins...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.email} className="group p-6 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-rose-100 hover:bg-white transition-all flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img 
                    src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    className="w-20 h-20 rounded-3xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500 shadow-xl"
                    alt="avatar"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Flame size={14} className="text-orange-500" />
                  </div>
                </div>
                
                <h4 className="font-bold text-slate-900 text-base mb-1">{user.penName || user.name}</h4>
                <p className="text-[9px] text-slate-400 font-medium truncate w-full px-4 mb-5 uppercase tracking-tighter">
                  {user.email}
                </p>

                <button 
                  onClick={() => handleSendChallenge(user)}
                  disabled={actionLoading === user.email}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  {actionLoading === user.email ? <Loader2 className="animate-spin" size={14} /> : <UserPlus size={14} />}
                  Défier
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-slate-400 italic text-sm">Aucun auteur ne correspond à votre recherche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
