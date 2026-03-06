"use client";
import React, { useState, useEffect } from 'react';
import { Sword, Users, Loader2, CheckCircle2, Circle, Search, Trophy, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function LanceurDeDuel({ currentUser }) {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const ADMIN_EMAILS = ["cmo.lablitteraire7@gmail.com", "admin@lisible.biz"];

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // 1. On récupère les publications (data/publications)
        const resPubs = await fetch('/api/github-db?type=publications');
        // 2. On récupère tous les profils (data/users)
        const resUsers = await fetch('/api/github-db?type=users');
        
        if (resPubs.ok && resUsers.ok) {
          const dataPubs = await resPubs.json();
          const dataUsers = await resUsers.json();

          // On crée un dictionnaire des profils pour un accès rapide
          const usersDict = {};
          dataUsers.content.forEach(u => {
            usersDict[u.email] = u;
          });

          // On extrait les emails uniques des publications
          const uniqueEmails = [...new Set(dataPubs.content.map(p => p.authorEmail))];

          const filtered = uniqueEmails.reduce((acc, email) => {
            const profile = usersDict[email];
            const isAdmin = ADMIN_EMAILS.includes(email);
            const isMe = email === currentUser?.email;

            if (email && !isAdmin && !isMe && profile && profile.status !== "deleted") {
              acc.push({
                email: email,
                name: profile.penName || profile.name || "Auteur Anonyme",
                image: profile.image
              });
            }
            return acc;
          }, []);

          setAvailableUsers(filtered);
        }
      } catch (e) {
        toast.error("Erreur lors du croisement des données auteurs.");
        console.error(e);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    if (currentUser?.email) loadUsers();
  }, [currentUser]);

  const filtrerUsers = availableUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const envoyerDefi = async () => {
    if (!selectedUser) return toast.error("Veuillez choisir un adversaire.");
    
    setIsSending(true);
    const t = toast.loading(`Envoi du défi à ${selectedUser.name}...`);

    try {
      const res = await fetch('/api/duel-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sendChallenge',
          senderEmail: currentUser.email,
          senderName: currentUser.penName || currentUser.name || "Un auteur",
          targetEmail: selectedUser.email
        })
      });

      if (res.ok) {
        toast.success(`Gantelet jeté ! L'honneur est en jeu.`, { id: t });
        setSelectedUser(null);
        if (window.location.pathname.includes('gestion')) window.location.reload();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Échec de l'envoi");
      }
    } catch (e) {
      toast.error(e.message, { id: t });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-2xl max-w-md w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl animate-pulse">
          <Sword size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">Arène des Duels.</h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
            <Trophy size={10} /> Honneur & Littérature
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="Chercher un auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 transition-all outline-none"
            />
          </div>
          
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">
            Adversaires qualifiés ({filtrerUsers.length})
          </label>
          
          <div className="max-h-60 overflow-y-auto bg-slate-50 rounded-[2rem] p-3 border border-slate-100 space-y-2 custom-scrollbar">
            {isLoadingUsers ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 size={24} className="animate-spin text-rose-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Chargement des profils...</span>
              </div>
            ) : filtrerUsers.length > 0 ? (
              filtrerUsers.map(u => (
                <button 
                  key={u.email}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center justify-between w-full p-4 rounded-2xl border transition-all ${
                    selectedUser?.email === u.email 
                    ? 'bg-rose-50 border-rose-200 shadow-sm' 
                    : 'bg-white border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <img 
                      src={u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} 
                      className="w-8 h-8 rounded-full bg-slate-100 object-cover"
                      alt="avatar"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{u.name}</span>
                      <span className="text-[9px] text-slate-400 truncate w-24">{u.email}</span>
                    </div>
                  </div>
                  {selectedUser?.email === u.email ? (
                    <div className="bg-rose-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : (
                    <Circle size={16} className="text-slate-200" />
                  )}
                </button>
              ))
            ) : (
              <p className="text-center py-10 text-xs text-slate-400 font-medium">Aucun auteur disponible.</p>
            )}
          </div>
        </div>

        {selectedUser && (
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <img 
                src={selectedUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.email}`} 
                className="h-10 w-10 rounded-full border-2 border-rose-500 object-cover"
                alt="target"
              />
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Adversaire ciblé</p>
                <p className="text-sm font-bold truncate w-32">{selectedUser.name}</p>
              </div>
            </div>
            <Flame className="text-rose-500 animate-bounce" size={24} />
          </div>
        )}

        <button
          onClick={envoyerDefi}
          disabled={isSending || !selectedUser}
          className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-900/20 disabled:opacity-50"
        >
          {isSending ? <Loader2 className="animate-spin" size={18} /> : <Sword size={18} />}
          Lancer le Duel
        </button>
      </div>
    </div>
  );
}
