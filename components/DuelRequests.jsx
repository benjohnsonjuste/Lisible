"use client";
import React, { useState, useEffect } from 'react';
import { Sword, Users, Loader2, CheckCircle2, Circle, Search, Trophy, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function LanceurDeDuel({ currentUser }) {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // Un seul adversaire à la fois
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Liste des emails administratifs à exclure
  const ADMIN_EMAILS = ["cmo.lablitteraire7@gmail.com", "admin@lisible.biz"];

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/github-db?type=publications');
        if (res.ok) {
          const data = await res.json();
          // Extraire les auteurs uniques, exclure les admins et l'utilisateur actuel
          const users = data.content.reduce((acc, pub) => {
            const isAlreadyInList = acc.find(u => u.email === pub.authorEmail);
            const isAdmin = ADMIN_EMAILS.includes(pub.authorEmail);
            const isMe = pub.authorEmail === currentUser?.email;

            if (!isAlreadyInList && !isAdmin && !isMe) {
              acc.push({ email: pub.authorEmail, name: pub.author });
            }
            return acc;
          }, []);
          setAvailableUsers(users);
        }
      } catch (e) {
        toast.error("Impossible de charger les adversaires potentiels.");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    if (currentUser?.email) loadUsers();
  }, [currentUser]);

  const filtrerUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const envoyerDefi = async () => {
    if (!selectedUser) return toast.error("Veuillez choisir un adversaire.");
    
    setIsSending(true);
    const t = toast.loading(`Envoi du défi à ${selectedUser.name}...`);

    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'challenge',
          senderEmail: currentUser.email,
          senderName: currentUser.name || "Un auteur",
          targetEmail: selectedUser.email,
          targetName: selectedUser.name
        })
      });

      if (res.ok) {
        toast.success(`Gantelet jeté ! Attendez la réponse de ${selectedUser.name}.`, { id: t });
        setSelectedUser(null);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Échec de l'envoi du défi");
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
        {/* RECHERECHE & SÉLECTION */}
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
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>
          
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">
            Choisir un adversaire ({filtrerUsers.length})
          </label>
          
          <div className="max-h-60 overflow-y-auto bg-slate-50 rounded-[2rem] p-3 border border-slate-100 space-y-2 custom-scrollbar">
            {isLoadingUsers ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 size={24} className="animate-spin text-rose-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Appel des guerriers...</span>
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
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-bold text-slate-800">{u.name}</span>
                    <span className="text-[9px] text-slate-400 truncate w-32">{u.email}</span>
                  </div>
                  {selectedUser?.email === u.email ? (
                    <div className="bg-rose-500 text-white p-1 rounded-full"><CheckCircle2 size={16} /></div>
                  ) : (
                    <Circle size={18} className="text-slate-200" />
                  )}
                </button>
              ))
            ) : (
              <p className="text-center py-10 text-xs text-slate-400 font-medium">Aucun auteur trouvé.</p>
            )}
          </div>
        </div>

        {/* RÉSUMÉ DU DÉFI */}
        {selectedUser && (
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center font-black">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Adversaire ciblé</p>
                <p className="text-sm font-bold truncate w-32">{selectedUser.name}</p>
              </div>
            </div>
            <Flame className="text-rose-500 animate-bounce" size={24} />
          </div>
        )}

        {/* BOUTON D'ACTION */}
        <button
          onClick={envoyerDefi}
          disabled={isSending || !selectedUser}
          className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-900/20 disabled:opacity-50 disabled:grayscale"
        >
          {isSending ? <Loader2 className="animate-spin" size={18} /> : <Sword size={18} />}
          Lancer le Duel
        </button>
      </div>
    </div>
  );
}
