"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, CreditCard, Camera, Save, Edit3, ArrowLeft, ShieldCheck, Sparkles, Loader2, BookOpen, Eye, Heart } from "lucide-react";
import MetricsOverview from "@/components/MetricsOverview";
import Link from "next/link";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [myTexts, setMyTexts] = useState([]);

  // États de formulaires stabilisés
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: ""
  });

  const [payment, setPayment] = useState({
    method: "PayPal", paypalEmail: "",
    wuFirstName: "", wuLastName: "", country: "", areaCode: "", phone: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const storedUser = localStorage.getItem("lisible_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        
        // Initialisation des champs
        setFormData({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          penName: parsed.penName || parsed.name || "",
          birthday: parsed.birthday || "",
          profilePic: parsed.profilePic || ""
        });

        setPayment({
          method: parsed.paymentMethod || "PayPal",
          paypalEmail: parsed.paypalEmail || "",
          wuFirstName: parsed.wuMoneyGram?.firstName || "",
          wuLastName: parsed.wuMoneyGram?.lastName || "",
          country: parsed.wuMoneyGram?.country || "",
          areaCode: parsed.wuMoneyGram?.areaCode || "",
          phone: parsed.wuMoneyGram?.phone || "",
        });

        if (!parsed.paymentMethod) setEditingPayment(true);
        
        // Chargement des textes avec bypass de cache
        fetchAuthorTexts(parsed.email);
      }
      setLoading(false);
    };

    loadData();
  }, []);

  const fetchAuthorTexts = async (email) => {
    if (!email) return;
    try {
      // Bypass cache avec timestamp
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;
      const files = await res.json();
      
      const textPromises = files
        .filter(f => f.name.endsWith('.json'))
        .map(file => fetch(`${file.download_url}?t=${Date.now()}`).then(r => r.json()));
      
      const allTexts = await Promise.all(textPromises);
      const filtered = allTexts.filter(t => 
        t.authorEmail && t.authorEmail.toLowerCase() === email.toLowerCase()
      );
      
      setMyTexts(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (e) {
      console.error("Erreur chargement textes:", e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Fichier trop lourd (max 5Mo)");

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8); // Qualité augmentée
        setFormData(prev => ({ ...prev, profilePic: compressedBase64 }));
        setIsUploading(false);
        toast.success("Photo prête à être enregistrée");
      };
    };
    reader.readAsDataURL(file);
  };

  const saveAllToStaffRegistry = async () => {
    if (!formData.firstName || !formData.lastName) return toast.error("Prénom et Nom requis");
    const loadingToast = toast.loading("Mise à jour sécurisée du registre...");
    
    // Construction de l'objet de mise à jour complet
    const updatedUserData = {
      ...user, // Garde les anciennes données (stats, etc)
      firstName: formData.firstName,
      lastName: formData.lastName,
      penName: formData.penName,
      birthday: formData.birthday,
      profilePic: formData.profilePic,
      paymentMethod: payment.method,
      paypalEmail: payment.paypalEmail,
      wuMoneyGram: {
        firstName: payment.wuFirstName,
        lastName: payment.wuLastName,
        country: payment.country,
        areaCode: payment.areaCode,
        phone: payment.phone,
      }
    };

    try {
      // 1. Sauvegarde GitHub (Source de vérité)
      const res = await fetch("/api/save-user-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      });

      if (!res.ok) throw new Error("Échec de la synchronisation cloud");

      // 2. Sauvegarde Locale (Instantanéité)
      localStorage.setItem("lisible_user", JSON.stringify(updatedUserData));
      
      // 3. Mise à jour de l'état UI
      setUser(updatedUserData);
      setEditingPayment(false);
      
      toast.success("Informations stabilisées et enregistrées !", { id: loadingToast });
    } catch (err) {
      toast.error("Erreur : " + err.message, { id: loadingToast });
    }
  };

  if (loading) return <div className="flex flex-col justify-center items-center h-screen bg-white"><Loader2 className="animate-spin text-teal-600 mb-2" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accès aux archives...</p></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-teal-50 rounded-2xl text-teal-600">
              <User size={32} strokeWidth={2.5} />
           </div>
           <div>
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Mon Compte</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Registre officiel des auteurs</p>
          </div>
        </div>
        <Link href="/dashboard" className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 border border-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-xl font-black flex items-center gap-3 italic text-slate-800 uppercase text-[12px] tracking-widest">
              <Edit3 className="text-teal-600" size={18} /> Profil Public
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2.5rem] bg-white overflow-hidden border-4 border-white shadow-2xl relative group">
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80"><Loader2 className="animate-spin text-teal-600" /></div>
                  ) : (
                    <img src={formData.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="Profil" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer shadow-xl hover:bg-slate-900 transition-all hover:scale-110">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="text-center sm:text-left space-y-1">
                <p className="text-2xl font-black text-slate-900 italic tracking-tight">{formData.penName || user?.name}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] text-teal-600 font-black uppercase tracking-widest">
                   <ShieldCheck size={14} /> Membre Certifié Lisible
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InputBlock label="Prénom Civil" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
              <InputBlock label="Nom Civil" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
              <InputBlock label="Nom de plume (Public)" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button onClick={saveAllToStaffRegistry} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-xl active:scale-[0.98]">
              Stabiliser et Sauvegarder
            </button>
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50">
            <h2 className="text-xl font-black flex items-center gap-3 italic text-slate-800 uppercase text-[12px] tracking-widest mb-8">
              <BookOpen className="text-teal-600" /> Mes Manuscrits ({myTexts.length})
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {myTexts.length > 0 ? myTexts.map((txt) => (
                <Link href={`/texts/${txt.id}`} key={txt.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100 group">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 group-hover:text-teal-600 transition-colors">{txt.title}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(txt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex gap-4 sm:gap-6 text-slate-400">
                    <div className="flex items-center gap-1.5"><Eye size={14}/> <span className="text-xs font-black text-slate-700">{txt.views || 0}</span></div>
                    <div className="flex items-center gap-1.5"><Heart size={14} className="group-hover:text-rose-500 transition-colors" /> <span className="text-xs font-black text-slate-700">{txt.likes?.length || 0}</span></div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-16 text-slate-300 font-black uppercase text-[9px] tracking-[0.3em] border-2 border-dashed border-slate-100 rounded-[2rem]">
                  Aucun manuscrit trouvé pour cet auteur
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl h-fit sticky top-10 border border-white/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><CreditCard size={120} /></div>
          
          <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8 relative z-10">
            <CreditCard size={24} /> Versements
          </h2>
          
          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Méthode de réception</label>
                <select disabled={!editingPayment} value={payment.method} onChange={e => setPayment({...payment, method: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-sm font-bold text-white outline-none ring-teal-500/30 focus:ring-2 transition-all">
                  <option value="PayPal">PayPal (International)</option>
                  <option value="Western Union">Western Union</option>
                  <option value="MoneyGram">MoneyGram</option>
                </select>
            </div>

            {payment.method === "PayPal" ? (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Adresse PayPal</label>
                <input type="email" disabled={!editingPayment} value={payment.paypalEmail} onChange={e => setPayment({...payment, paypalEmail: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-sm font-bold text-teal-400 outline-none" placeholder="destinataire@email.com" />
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <InputBlockDark label="Prénom Bénéficiaire" value={payment.wuFirstName} onChange={v => setPayment({...payment, wuFirstName: v})} disabled={!editingPayment} />
                <InputBlockDark label="Nom Bénéficiaire" value={payment.wuLastName} onChange={v => setPayment({...payment, wuLastName: v})} disabled={!editingPayment} />
                <div className="grid grid-cols-2 gap-4">
                  <InputBlockDark label="Pays" value={payment.country} onChange={v => setPayment({...payment, country: v})} disabled={!editingPayment} />
                  <InputBlockDark label="Téléphone" value={payment.phone} onChange={v => setPayment({...payment, phone: v})} disabled={!editingPayment} />
                </div>
              </div>
            )}
            
            <div className="pt-6">
              {editingPayment ? (
                <button onClick={saveAllToStaffRegistry} className="w-full py-5 bg-teal-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all">
                  Valider les coordonnées
                </button>
              ) : (
                <button onClick={() => setEditingPayment(true)} className="w-full py-5 bg-slate-800 text-teal-400 rounded-xl font-black text-[10px] uppercase border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                  <Edit3 size={16} /> Modifier les informations
                </button>
              )}
            </div>
            <p className="text-[8px] text-slate-500 font-bold leading-relaxed text-center px-4">Les fonds sont versés entre le 1er et le 5 de chaque mois selon les paliers de lecture atteints.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function InputBlock({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all text-slate-700 shadow-inner" 
      />
    </div>
  );
}

function InputBlockDark({ label, value, onChange, disabled }) {
    return (
      <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">{label}</label>
        <input 
          disabled={disabled}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-teal-500 transition-all disabled:opacity-50" 
        />
      </div>
    );
  }
