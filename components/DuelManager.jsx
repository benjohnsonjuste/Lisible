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

  // 1. Chargement des utilisateurs depuis data/users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/github-db?type=users");
        if (res.ok) {
          const data = await res.json();
          // Exclure les admins et soi-même
          const admins = ["cmo.lablitteraire7@gmail.com", "admin@lisible.biz"];
          const filtered = data.content.filter(u => 
            u.email !== currentUser?.email && 
            !admins.includes(u.email) &&
            u.status !== "deleted"
          );
          setUsers(filtered);
        }
      } catch (e) {
        toast.error("Erreur de synchronisation avec l'Arène.");
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.email) fetchUsers();
  }, [currentUser]);

  // 2. Logique : Lancer un défi
  const handleSendChallenge = async (target) => {
    setActionLoading(target.email);
    const t = toast.loading(`Envoi du gantelet à ${target.penName || target.name}...`);
    
    try {
      const res = await fetch("/api/duel-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendChallenge",
          senderEmail: currentUser.email,
          senderName: currentUser.penName || currentUser.name,
          targetEmail: target.email
        })
      });

      if (res.ok) {
        toast.success("Défi envoyé ! L'honneur est en jeu.", { id: t });
      } else {
        const err = await res.json();
        toast.error(err.error || "Impossible d'envoyer le défi.", { id: t });
      }
    } catch (e) {
      toast.error("Erreur de connexion.", { id: t });
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Logique : Accepter/Refuser (pour les requêtes reçues)
  const handleResponse = async (requestId, responseAction) => {
    setActionLoading(requestId);
    const t = toast.loading("Traitement de l'invitation...");

    try {
      const res = await fetch("/api/duel-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: responseAction, // 'acceptChallenge' ou 'declineChallenge'
          requestId,
          email: currentUser.email
        })
      });

      if (res.ok) {
        toast.success(responseAction === "acceptChallenge" ? "Duel programmé pour dimanche !" : "Défi décliné.", { id: t });
        window.location.reload(); // Recharger pour mettre à jour le profil de l'user
      }
    } catch (e) {
      toast.error("Erreur système.", { id: t });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.penName || u.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-4">
      
      {/* SECTION : REQUÊTES EN ATTENTE */}
      {currentUser?.duelRequests?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Zap className="text-rose-500 fill-rose-500" size={16} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Défis en attente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUser.duelRequests.map((req) => (
              <div key={req.id} className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-[9px] font-bold text-rose-500 uppercase mb-1">Nouvelle provocation</p>
                  <p className="text-white font-bold">{req.fromName}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleResponse(req.id, "acceptChallenge")}
                    disabled={actionLoading === req.id}
                    className="p-3 bg-teal-500 text-slate-900 rounded-full hover:scale-110 transition-transform"
                  >
                    {actionLoading === req.id ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  </button>
                  <button 
                    onClick={() => handleResponse(req.id, "declineChallenge")}
                    className="p-3 bg-white/5 text-white rounded-full hover:bg-rose-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION : LANCER UN DÉFI */}
      <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 flex items-center gap-3">
              Lancer un gant <Sword className="text-rose-600" />
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cherchez un adversaire parmi les inscrits</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Nom de plume..."
              className="pl-12 pr-6 py-3 bg-slate-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-rose-500 w-full md:w-64 transition-all"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-rose-500" size={32} />
              <p className="text-[10px] font-black uppercase text-slate-400">Ouverture de l'annuaire...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.email} className="group p-4 bg-slate-50 rounded-[2rem] border border-transparent hover:border-rose-200 hover:bg-white transition-all flex flex-col items-center text-center">
                <img 
                  src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                  className="w-16 h-16 rounded-2xl mb-4 object-cover grayscale group-hover:grayscale-0 transition-all shadow-lg"
                  alt="avatar"
                />
                <h4 className="font-bold text-slate-900 text-sm mb-1">{user.penName || user.name}</h4>
                <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-4">
                  <Flame size={10} className="text-orange-500" /> Prêt au combat
                </div>
                <button 
                  onClick={() => handleSendChallenge(user)}
                  disabled={actionLoading === user.email}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading === user.email ? <Loader2 className="animate-spin" size={12} /> : <UserPlus size={12} />}
                  Défier
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-slate-400 italic text-sm">
              Aucun auteur ne correspond à votre recherche.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
