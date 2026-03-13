"use client";
import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, Megaphone, Stars, ShieldAlert, Loader2, Link as LinkIcon, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function LanceurDeSignaux({ targets = [] }) {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("info");
  const [isSending, setIsSending] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Initialisation : on sélectionne tout le monde par défaut au chargement des cibles
  useEffect(() => {
    if (targets.length > 0) {
      setSelectedUsers(targets);
    }
  }, [targets]);

  const toggleUser = (email) => {
    setSelectedUsers(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const toggleAll = () => {
    if (selectedUsers.length === targets.length) setSelectedUsers([]);
    else setSelectedUsers(targets);
  };

  const envoyerSignal = async () => {
    if (!message.trim()) return toast.error("Le message est vide.");
    if (selectedUsers.length === 0) return toast.error("Sélectionnez au moins un destinataire.");
    
    setIsSending(true);
    const t = toast.loading(`Diffusion à ${selectedUsers.length} utilisateur(s)...`);

    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'broadcast',
          message, 
          type,
          link: link.trim() || null,
          targetEmails: selectedUsers,
          adminToken: sessionStorage.getItem('admin_access_token') 
        })
      });

      if (res.ok) {
        toast.success("Signal diffusé avec succès !", { id: t });
        setMessage("");
        setLink("");
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Échec de diffusion");
      }
    } catch (e) {
      toast.error(e.message || "Erreur de liaison.", { id: t });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-2xl max-w-xl w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-100 text-teal-600 rounded-2xl">
          <Megaphone size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 leading-none">Diffusion.</h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Cible : Inscrits (data/users)</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between ml-2 mb-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Liste des cibles ({selectedUsers.length})</label>
            <button onClick={toggleAll} className="text-[9px] font-bold text-teal-600 uppercase hover:underline">
              {selectedUsers.length === targets.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-[2rem] p-4 border border-slate-100 space-y-2 custom-scrollbar">
            {targets.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-[10px] font-bold text-slate-400 uppercase animate-pulse">Recherche des comptes...</div>
            ) : (
              targets.map(email => (
                <button 
                  key={email}
                  onClick={() => toggleUser(email)}
                  className="flex items-center justify-between w-full p-3 bg-white rounded-xl border border-transparent hover:border-teal-100 transition-all shadow-sm"
                >
                  <span className="text-[11px] font-bold text-slate-600 truncate">{email}</span>
                  {selectedUsers.includes(email) ? <CheckCircle2 size={16} className="text-teal-500" /> : <Circle size={16} className="text-slate-200" />}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
            {['info', 'warning', 'urgent'].map((t) => (
              <button 
                key={t} 
                type="button"
                onClick={() => setType(t)} 
                className={`p-3 rounded-xl text-[9px] font-black uppercase border transition-all ${type === t ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                {t}
              </button>
            ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-6 bg-slate-50 border-none rounded-[2rem] text-sm focus:ring-2 focus:ring-teal-500 transition-all text-slate-900"
          placeholder="Votre message ici..."
          rows={3}
        />

        <div className="relative">
          <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-xs focus:ring-2 focus:ring-teal-500 transition-all"
            placeholder="Lien optionnel (ex: /dashboard)"
          />
        </div>

        <button
          onClick={envoyerSignal}
          disabled={isSending || selectedUsers.length === 0}
          className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-teal-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Lancer l'alerte
        </button>
      </div>
    </div>
  );
}
