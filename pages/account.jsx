"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, Camera, Edit3, ArrowLeft, Loader2, Save, Download, Award, 
  Share2, Key, Trash2, AlertTriangle, ShieldCheck, CheckCircle2, Sparkles
} from "lucide-react";

const Input = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <input 
      type={type} 
      value={value || ""} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-teal-400 focus:bg-white transition-all shadow-inner" 
    />
  </div>
);

export default function AccountPage() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [pass, setPass] = useState({ cur: "", nxt: "" });
  const [load, setLoad] = useState({ save: false, pass: false, del: false });

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (!stored) return router.push("/login");
    const parsed = JSON.parse(stored);
    
    const fetchUser = async () => {
      try {
        const id = btoa(parsed.email.toLowerCase().trim()).replace(/=/g, "");
        const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${id}.json?t=${Date.now()}`);
        if (res.ok) {
          const file = await res.json();
          const data = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
          setUser(data);
          setForm(data);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchUser();
  }, [router]);

  // Dessin automatique du badge avec Logo
  useEffect(() => {
    if (form?.email && canvasRef.current) {
      drawBadge(form);
    }
  }, [form]);

  const drawBadge = (u) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // 1. Fond sombre élégant
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(0, 0, 400, 220, 30);
    ctx.fill();

    // 2. Bordure dégradée (simulée)
    ctx.strokeStyle = "#14b8a6";
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Dessin du Logo "L" (Lisible) stylisé
    ctx.fillStyle = "#14b8a6";
    ctx.beginPath();
    ctx.roundRect(330, 30, 40, 40, 10);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "900 24px sans-serif";
    ctx.fillText("L", 342, 60);

    // 4. Informations Utilisateur
    ctx.fillStyle = "white";
    ctx.font = "900 22px sans-serif";
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || "Plume Lisible";
    ctx.fillText(name.toUpperCase(), 30, 60);

    ctx.fillStyle = "#64748b";
    ctx.font = "500 13px sans-serif";
    ctx.fillText(u.email || "", 30, 85);

    // 5. Label Officiel avec icône
    ctx.fillStyle = "rgba(20, 184, 166, 0.1)";
    ctx.beginPath();
    ctx.roundRect(30, 110, 180, 30, 8);
    ctx.fill();
    ctx.fillStyle = "#14b8a6";
    ctx.font = "900 10px sans-serif";
    ctx.fillText("✓ COMPTE OFFICIEL", 45, 130);

    // 6. Pied de badge
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath(); ctx.moveTo(0, 160); ctx.lineTo(400, 160); ctx.stroke();
    
    ctx.fillStyle = "white";
    ctx.font = "italic 900 18px sans-serif";
    ctx.fillText("lisible.biz", 30, 195);
    
    ctx.fillStyle = "#475569";
    ctx.font = "700 10px sans-serif";
    ctx.fillText("CERTIFIÉ PAR L'ÉDITEUR", 260, 195);
  };

  const onSave = async () => {
    setLoad({...load, save: true});
    try {
      const res = await fetch('/api/update-user', { 
        method: 'PATCH', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ email: user.email, userData: form })
      });
      if (res.ok) { 
        localStorage.setItem("lisible_user", JSON.stringify(form)); 
        setUser(form); 
        toast.success("Profil mis à jour en temps réel"); 
      }
    } catch (e) { toast.error("Erreur de connexion"); }
    setLoad({...load, save: false});
  };

  const onPass = async () => {
    if(!pass.cur || !pass.nxt) return toast.error("Champs requis");
    setLoad({...load, pass: true});
    const res = await fetch("/api/update-password", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ email: user.email, currentPassword: pass.cur, newPassword: pass.nxt })});
    if (res.ok) { toast.success("Secret modifié"); setPass({cur:"", nxt:""}); }
    setLoad({...load, pass: false});
  };

  const onDel = async () => {
    if(!confirm("Supprimer définitivement ?")) return;
    setLoad({...load, del: true});
    const res = await fetch("/api/delete-account", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ email: user.email })});
    if (res.ok) { localStorage.clear(); router.push("/login"); }
    setLoad({...load, del: false});
  };

  if (loading || !user) return <div className="h-screen flex items-center justify-center font-black text-teal-600 animate-pulse">CHARGEMENT...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER */}
      <header className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 text-white rounded-2xl"><ShieldCheck size={24}/></div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter leading-none">Gestion du Compte</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Identité Officielle Lisible</p>
          </div>
        </div>
        <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><ArrowLeft size={20}/></button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE : FORMULAIRES */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-8">
            <h2 className="text-[10px] font-black uppercase text-teal-600 flex items-center gap-2 tracking-widest"><Edit3 size={16}/> Informations du Registre</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Prénom" value={form.firstName} onChange={v => setForm({...form, firstName: v})} />
              <Input label="Nom" value={form.lastName} onChange={v => setForm({...form, lastName: v})} />
              <div className="md:col-span-2">
                <Input label="Nom de plume" value={form.penName} onChange={v => setForm({...form, penName: v})} />
              </div>
            </div>
            <button onClick={onSave} disabled={load.save} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3">
              {load.save ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Enregistrer les modifications
            </button>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-8">
            <h2 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><Key size={16}/> Sécurité</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Mot de passe actuel" type="password" value={pass.cur} onChange={v => setPass({...pass, cur: v})} />
              <Input label="Nouveau mot de passe" type="password" value={pass.nxt} onChange={v => setPass({...pass, nxt: v})} />
            </div>
            <button onClick={onPass} disabled={load.pass} className="w-full py-5 border-2 border-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
              Mettre à jour le secret
            </button>
          </section>

          <section className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex items-center justify-between">
            <div>
              <h2 className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Zone critique</h2>
              <p className="text-[10px] text-rose-400 font-bold italic">Suppression définitive du compte</p>
            </div>
            <button onClick={onDel} className="p-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all">
              <Trash2 size={20}/>
            </button>
          </section>
        </div>

        {/* COLONNE DROITE : BADGE AUTOMATIQUE */}
        <aside className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl sticky top-8 border border-white/5">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-400 flex items-center gap-2">
                 <Award size={18}/> Badge Officiel
               </h2>
               <div className="px-3 py-1 bg-teal-500/10 text-teal-400 rounded-full text-[8px] font-black tracking-tighter">LIVE PREVIEW</div>
            </div>
            
            <canvas ref={canvasRef} width="400" height="220" className="w-full h-auto rounded-2xl bg-slate-950 mb-8 border border-white/10" />

            <div className="space-y-3">
              <button 
                onClick={() => {
                  const a = document.createElement("a"); 
                  a.download = `Badge_Lisible.png`; 
                  a.href = canvasRef.current.toDataURL(); 
                  a.click();
                  toast.success("Badge enregistré");
                }} 
                className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-teal-500 transition-all flex justify-center items-center gap-2"
              >
                <Download size={16}/> Télécharger HD (PNG)
              </button>
              
              <button 
                onClick={() => {
                  const msg = "J'ai mon compte officiel sur lisible.biz, passe me visiter ! https://lisible.biz";
                  navigator.clipboard.writeText(msg);
                  toast.success("Message copié !");
                }} 
                className="w-full py-4 bg-slate-800 text-teal-400 rounded-xl font-black text-[11px] uppercase tracking-widest border border-white/5 hover:bg-slate-700 transition-all flex justify-center items-center gap-2"
              >
                <Share2 size={16}/> Partager mon statut
              </button>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
               <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed text-center">
                 "Ce badge certifie votre identité auprès de vos lecteurs sur WhatsApp, Facebook et Instagram."
               </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
