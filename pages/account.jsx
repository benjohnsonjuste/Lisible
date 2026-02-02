"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  User, Camera, Edit3, ArrowLeft, Loader2, Save, Download, Award, 
  Share2, Key, Trash2, AlertTriangle, ShieldCheck
} from "lucide-react";

const Input = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-400 transition-all" />
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
      const id = btoa(parsed.email.toLowerCase().trim()).replace(/=/g, "");
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${id}.json?t=${Date.now()}`);
      if (res.ok) {
        const file = await res.json();
        const data = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
        setUser(data);
        setForm(data);
        drawBadge(data);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const drawBadge = (u) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = "#0f172a"; ctx.roundRect(0, 0, 400, 200, 20); ctx.fill();
    ctx.strokeStyle = "#14b8a6"; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = "white"; ctx.font = "bold 22px sans-serif"; ctx.fillText(`${u.firstName || ''} ${u.lastName || ''}`, 30, 60);
    ctx.fillStyle = "#94a3b8"; ctx.font = "14px sans-serif"; ctx.fillText(u.email, 30, 90);
    ctx.fillStyle = "#14b8a6"; ctx.font = "900 12px sans-serif"; ctx.fillText("COMPTE OFFICIEL LISIBLE", 30, 135);
    ctx.fillStyle = "white"; ctx.font = "bold 16px sans-serif"; ctx.fillText("lisible.biz", 30, 165);
  };

  const onSave = async () => {
    setLoad({...load, save: true});
    const res = await fetch('/api/update-user', { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: user.email, userData: form })});
    if (res.ok) { localStorage.setItem("lisible_user", JSON.stringify(form)); setUser(form); toast.success("Profil mis à jour"); }
    setLoad({...load, save: false});
  };

  const onPass = async () => {
    if(!pass.cur || !pass.nxt) return toast.error("Champs vides");
    setLoad({...load, pass: true});
    const res = await fetch("/api/update-password", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ email: user.email, currentPassword: pass.cur, newPassword: pass.nxt })});
    if (res.ok) { toast.success("Mot de passe modifié"); setPass({cur:"", nxt:""}); } else { toast.error("Erreur"); }
    setLoad({...load, pass: false});
  };

  const onDel = async () => {
    if(!confirm("Supprimer définitivement ?")) return;
    setLoad({...load, del: true});
    const res = await fetch("/api/delete-account", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ email: user.email })});
    if (res.ok) { localStorage.clear(); router.push("/login"); }
    setLoad({...load, del: false});
  };

  if (loading || !user) return <div className="h-screen flex items-center justify-center text-[10px] font-black uppercase">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
        <h1 className="text-2xl font-black italic tracking-tighter">Paramètres</h1>
        <button onClick={() => router.back()} className="p-3 bg-slate-50 rounded-xl text-slate-400"><ArrowLeft size={20}/></button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-50 space-y-6">
            <h2 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Edit3 size={14}/> Identité</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" value={form.firstName} onChange={v => setForm({...form, firstName: v})} />
              <Input label="Nom" value={form.lastName} onChange={v => setForm({...form, lastName: v})} />
              <div className="col-span-2"><Input label="Nom de plume" value={form.penName} onChange={v => setForm({...form, penName: v})} /></div>
            </div>
            <button onClick={onSave} disabled={load.save} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all">
              {load.save ? "..." : "Enregistrer les modifications"}
            </button>
          </section>

          <section className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-50 space-y-6">
            <h2 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Key size={14}/> Sécurité</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Secret actuel" type="password" value={pass.cur} onChange={v => setPass({...pass, cur: v})} />
              <Input label="Nouveau mot de passe" type="password" value={pass.nxt} onChange={v => setPass({...pass, nxt: v})} />
            </div>
            <button onClick={onPass} disabled={load.pass} className="w-full py-4 border-2 border-slate-900 rounded-xl font-black text-[10px] uppercase hover:bg-slate-900 hover:text-white transition-all">
              {load.pass ? "..." : "Mettre à jour le mot de passe"}
            </button>
          </section>

          <section className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 flex items-center justify-between">
            <div><h2 className="text-[10px] font-black uppercase text-rose-600">Zone de rupture</h2><p className="text-[10px] text-rose-400">Action irréversible</p></div>
            <button onClick={onDel} className="p-4 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200">
              <Trash2 size={16}/>
            </button>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white border border-teal-500/30">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-4 flex gap-2"><Award size={14}/> Badge Officiel</h2>
            <canvas ref={canvasRef} width="400" height="200" className="w-full h-auto rounded-xl bg-slate-950 mb-4" />
            <div className="flex gap-2">
              <button onClick={() => {const a=document.createElement("a"); a.download="badge.png"; a.href=canvasRef.current.toDataURL(); a.click();}} className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase transition-colors"><Download size={14} className="inline mr-1"/> PNG</button>
              <button onClick={() => {navigator.clipboard.writeText("J'ai mon compte officiel sur lisible.biz, passe me visiter https://lisible.biz"); toast.success("Texte copié !");}} className="flex-1 py-3 bg-teal-500 text-slate-900 rounded-xl font-black text-[10px] uppercase"><Share2 size={14} className="inline mr-1"/> Partager</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
