"use client";
import React, { useState, useEffect } from 'react';
import { Send, AlertTriangle, Megaphone, Stars, ShieldAlert, Loader2, Link as LinkIcon, Users, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function LanceurDeSignaux() {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("info");
  const [isSending, setIsSending] = useState(false);
  
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Charger les utilisateurs via l'index des publications
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/github-db?type=publications');
        if (res.ok) {
          const data = await res.json();
          // Extraire les emails uniques et noms des auteurs
          const users = data.content.reduce((acc, pub) => {
            if (!acc.find(u => u.email === pub.authorEmail)) {
              acc.push({ email: pub.authorEmail, name: pub.author });
            }
            return acc;
          }, []);
          setAvailableUsers(users);
          setSelectedUsers(users.map(u => u.email)); // Par défaut, tout le monde
        }
      } catch (e) {
        toast.error("Impossible de charger la liste des auteurs.");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

  const toggleUser = (email) => {
    setSelectedUsers(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const toggleAll = () => {
    if (selectedUsers.length === availableUsers.length) setSelectedUsers([]);
    else setSelectedUsers(availableUsers.map(u => u.email));
  };

  const envoyerSignal = async () => {
    if (!message.trim()) return toast.error("Le message est vide.");
    if (selectedUsers.length === 0) return toast.error("Sélectionnez au moins un destinataire.");
    
    setIsSending(true);
    const t = toast.loading(`Diffusion à ${selectedUsers.length} auteur(s)...`);

    try {
      const res = await fetch('/api/github-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'broadcast',
          message, 
          type,
          link: link.trim() || null,
          targetEmails: selectedUsers, // On passe la liste filtrée à l'API
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
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl max-w-xl w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
          <Megaphone size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">Diffusion Staff.</h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ciblage Précis</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SÉLECTION DES DESTINATAIRES */}
        <div>
          <div className="flex items-center justify-between ml-2 mb-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destinataires ({selectedUsers.length})</label>
            <button onClick={toggleAll} className="text-[9px] font-bold text-teal-600 uppercase">
              {selectedUsers.length === availableUsers.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>
          
          <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 space-y-2 custom-scrollbar">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-300" /></div>
            ) : availableUsers.map(u => (
              <button 
                key={u.email}
                onClick={() => toggleUser(u.email)}
                className="flex items-center justify-between w-full p-3 bg-white rounded-xl border border-transparent hover:border-teal-100 transition-all"
              >
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-bold text-slate-800">{u.name}</span>
                  <span className="text-[9px] text-slate-400 truncate w-40">{u.email}</span>
                </div>
                {selectedUsers.includes(u.email) ? <CheckCircle2 size={18} className="text-teal-500" /> : <Circle size={18} className="text-slate-200" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Type de Signal</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { id: 'info', icon: Stars, label: 'Info', color: 'text-teal-500' },
              { id: 'warning', icon: AlertTriangle, label: 'Alerte', color: 'text-amber-500' },
              { id: 'urgent', icon: ShieldAlert, label: 'Urgent', color: 'text-rose-500' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                  type === t.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-transparent text-slate-400'
                }`}
              >
                <t.icon size={20} className={type === t.id ? 'text-white' : t.color} />
                <span className="text-[9px] font-bold uppercase mt-2">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mt-2 p-6 bg-slate-50 border-none rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-teal-500 transition-all text-slate-900"
            placeholder="Écrivez le message..."
            rows={2}
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Lien (optionnel)</label>
          <div className="relative mt-2">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
              <LinkIcon size={14} />
            </div>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-teal-500 transition-all text-slate-900"
              placeholder="/dashboard, /texts/id..."
            />
          </div>
        </div>

        <button
          onClick={envoyerSignal}
          disabled={isSending || selectedUsers.length === 0}
          className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-900/20 disabled:opacity-50"
        >
          {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Diffuser le Signal
        </button>
      </div>
    </div>
  );
}
