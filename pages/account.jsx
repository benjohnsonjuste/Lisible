"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { User, CreditCard, Camera, Edit3, ArrowLeft, Loader2, Save, Download, Award, Wallet, Eye } from "lucide-react";

const InputBlock = ({ label, value, onChange, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 rounded-xl p-4 text-sm font-bold outline-none transition-all" />
  </div>
);

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", penName: "", birthday: "", profilePic: "", paymentMethod: "PayPal", paypalEmail: "", wuFirstName: "", wuLastName: "", wuCountry: "" });

  useEffect(() => {
    const stored = localStorage.getItem("lisible_user");
    if (!stored) return router.push("/login");
    const email = JSON.parse(stored).email;
    const fetchUser = async () => {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${btoa(email.toLowerCase().trim()).replace(/=/g, "")}.json`);
      if (res.ok) {
        const data = JSON.parse(atob((await res.json()).content));
        setUser(data);
        setFormData({ ...formData, ...data, wuFirstName: data.wuMoneyGram?.firstName, wuLastName: data.wuMoneyGram?.lastName, wuCountry: data.wuMoneyGram?.country });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const download = async (id, name) => {
    const t = toast.loading("Génération...");
    try {
      const canvas = await html2canvas(document.getElementById(id), { scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `${name}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Téléchargé", { id: t });
    } catch { toast.error("Erreur", { id: t }); }
  };

  const save = async () => {
    setIsSaving(true);
    const res = await fetch('/api/update-user', { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ email: user.email, userData: { ...user, ...formData, wuMoneyGram: { firstName: formData.wuFirstName, lastName: formData.wuLastName, country: formData.wuCountry } } })
    });
    if (res.ok) toast.success("Enregistré");
    setIsSaving(false);
  };

  if (loading || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-20">
      <header className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-xl text-white"><User size={24} /></div>
          <h1 className="text-2xl font-black italic tracking-tighter">Mon Compte</h1>
        </div>
        <button onClick={() => router.back()} className="p-3 bg-slate-50 rounded-xl"><ArrowLeft size={20} /></button>
      </header>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Prévisualisation Badge</h2>
          <button onClick={() => download("badge-officiel", "Badge_Lisible")} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-black text-[10px] flex items-center gap-2 uppercase"><Download size={12} /> PNG</button>
        </div>
        <div className="flex justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed">
          <div id="badge-officiel" className="w-[350px] h-[350px] bg-white flex flex-col items-center justify-center p-6 text-center border-[10px] border-slate-900 shadow-xl">
            <img src="/icon-192.png" className="w-12 h-12 mb-4" />
            <p className="text-teal-600 font-black uppercase text-[8px] tracking-[0.3em] mb-2">Compte Officiel</p>
            <h2 className="text-2xl font-black text-slate-900 uppercase">{formData.firstName} {formData.lastName}</h2>
            <p className="text-xs text-slate-400 lowercase mb-6">{user.email}</p>
            <p className="text-[9px] font-black uppercase border-t w-full pt-3 text-slate-300">lisible.biz</p>
          </div>
        </div>
      </section>

      {user.email === "cmo.lablitteraire7@gmail.com" && (
        <section className="bg-slate-950 rounded-[2.5rem] p-8 text-white space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-3"><Award className="text-teal-400" /> <span className="font-black uppercase text-sm">Battle 2026</span></div>
            <button onClick={() => download("cert-battle", "Certificat_Battle")} className="px-4 py-2 bg-white text-slate-900 rounded-lg font-black text-[10px] uppercase">Télécharger</button>
          </div>
          <div className="overflow-x-auto"><div id="cert-battle" className="w-[800px] h-[560px] bg-white p-10 border-[15px] border-double border-slate-900 text-slate-900 flex flex-col items-center text-center">
            <img src="/icon-192.png" className="w-16 h-16 mb-4" />
            <h1 className="text-3xl font-black uppercase mb-6 border-b-2 border-slate-900 pb-2">Certificat de participation</h1>
            <p className="italic font-serif text-lg">Décerné à</p>
            <h2 className="text-4xl font-black italic my-4 font-serif">{formData.firstName} {formData.lastName}</h2>
            <p className="max-w-md text-lg font-serif">Battle Poétique International 2026</p>
            <div className="w-full flex justify-between px-10 mt-auto items-end pb-4">
              <div className="text-left text-xs font-bold"><p>02/02/2026</p><p>Haiti</p></div>
              <div className="text-center"><img src="/icon-192.png" className="w-12 h-12 grayscale opacity-50 mb-1" /><p className="text-[8px] font-black border-t border-slate-900">CEO Ben Johnson Juste</p></div>
            </div>
          </div></div>
        </section>
      )}

      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 space-y-8">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Edit3 size={14} /> Profil & Paiement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
          <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
          <div className="md:col-span-2 flex gap-4">
            <button onClick={() => setFormData({...formData, paymentMethod: "PayPal"})} className={`flex-1 p-4 rounded-xl border-2 font-black text-[10px] ${formData.paymentMethod === "PayPal" ? "border-teal-500 bg-teal-50" : "border-slate-50 opacity-50"}`}>PAYPAL</button>
            <button onClick={() => setFormData({...formData, paymentMethod: "WU"})} className={`flex-1 p-4 rounded-xl border-2 font-black text-[10px] ${formData.paymentMethod === "WU" ? "border-teal-500 bg-teal-50" : "border-slate-50 opacity-50"}`}>W. UNION</button>
          </div>
          {formData.paymentMethod === "PayPal" ? <div className="md:col-span-2"><InputBlock label="Email PayPal" value={formData.paypalEmail} onChange={v => setFormData({...formData, paypalEmail: v})} /></div> : 
          <><InputBlock label="Bénéficiaire Prénom" value={formData.wuFirstName} onChange={v => setFormData({...formData, wuFirstName: v})} /><InputBlock label="Pays" value={formData.wuCountry} onChange={v => setFormData({...formData, wuCountry: v})} /></>}
        </div>
        <button disabled={isSaving} onClick={save} className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs flex justify-center items-center gap-2">
          {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={16} /> Enregistrer</>}
        </button>
      </div>
    </div>
  );
}
