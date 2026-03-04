"use client";
import React, { useState } from 'react';
import { Send, AlertTriangle, Megaphone, Stars, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function LanceurDeSignaux() {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isSending, setIsSending] = useState(false);

  const envoyerSignal = async () => {
    if (!message.trim()) return toast.error("Le message est vide.");
    
    setIsSending(true);
    const t = toast.loading("Diffusion du signal aux archives...");

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message, 
          type,
          adminToken: sessionStorage.getItem('admin_access_token') 
        })
      });

      if (res.ok) {
        toast.success("Signal diffusé avec succès !", { id: t });
        setMessage("");
      } else {
        throw new Error("Échec de diffusion");
      }
    } catch (e) {
      toast.error("Erreur de liaison avec le Grand Livre.", { id: t });
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
          <h2 className="text-2xl font-black italic tracking-tighter">Diffusion Staff.</h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Alerte Globale</p>
        </div>
      </div>

      <div className="space-y-6">
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
            className="w-full mt-2 p-6 bg-slate-50 border-none rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-teal-500 transition-all"
            placeholder="Écrivez le message à diffuser..."
            rows={4}
          />
        </div>

        <button
          onClick={envoyerSignal}
          disabled={isSending}
          className="w-full py-5 bg-teal-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-900/20"
        >
          {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Lancer le Signal
        </button>
      </div>
    </div>
  );
}
