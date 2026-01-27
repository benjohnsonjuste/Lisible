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

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: ""
  });

  const [payment, setPayment] = useState({
    method: "PayPal", paypalEmail: "",
    wuFirstName: "", wuLastName: "", country: "", areaCode: "", phone: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
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
      
      // Lancement de la récupération des textes
      fetchAuthorTexts(parsed.email);
    }
    setLoading(false);
  }, []);

  const fetchAuthorTexts = async (email) => {
    if (!email) return;
    try {
      // 1. Lister les fichiers dans le dossier publications (via l'API GitHub)
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      if (!res.ok) return;
      const files = await res.json();
      
      // 2. Filtrer uniquement les fichiers .json et charger leur contenu
      const textPromises = files
        .filter(f => f.name.endsWith('.json'))
        .map(file => fetch(file.download_url).then(r => r.json()));
      
      const allTexts = await Promise.all(textPromises);
      
      // 3. Filtrer par email de l'auteur (insensible à la casse)
      const filtered = allTexts.filter(t => 
        t.authorEmail && t.authorEmail.toLowerCase() === email.toLowerCase()
      );
      
      setMyTexts(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (e) {
      console.error("Erreur chargement textes perso:", e);
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
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData(prev => ({ ...prev, profilePic: compressedBase64 }));
        setIsUploading(false);
        toast.success("Photo prête");
      };
    };
    reader.readAsDataURL(file);
  };

  const saveAllToStaffRegistry = async () => {
    if (!formData.firstName || !formData.lastName) return toast.error("Prénom et Nom requis");
    const loadingToast = toast.loading("Mise à jour du registre...");
    
    const payload = {
      email: user.email,
      name: user.name,
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
      const res = await fetch("/api/save-user-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde sur GitHub");

      localStorage.setItem("lisible_user", JSON.stringify({ ...user, ...payload }));
      setUser({ ...user, ...payload });
      setEditingPayment(false);
      toast.success("Profil mis à jour avec succès !", { id: loadingToast });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  if (loading) return <div className="flex justify-center py-40 text-teal-600"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-700">
      <header className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Mon Compte</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Bureau de l'écrivain</p>
        </div>
        <Link href="/bibliotheque" className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 border border-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          {/* SECTION PROFIL */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-xl font-black flex items-center gap-3 italic text-slate-800 uppercase text-[12px] tracking-widest">
              <User className="text-teal-600" /> Identité Littéraire
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2.2rem] bg-white overflow-hidden border-4 border-white shadow-2xl relative">
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                      <Loader2 className="animate-spin text-teal-600" />
                    </div>
                  ) : (
                    <img src={formData.profilePic || "/avatar.png"} className="w-full h-full object-cover" alt="Profil" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-teal-600 text-white rounded-2xl cursor-pointer shadow-xl hover:bg-slate-900 transition-colors">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl font-black text-slate-900 italic tracking-tight">{formData.penName || user?.name}</p>
                <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
              <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
              <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button onClick={saveAllToStaffRegistry} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-lg active:scale-95">
              Sauvegarder les modifications
            </button>
          </div>

          {/* MES PUBLICATIONS (Connectées à l'API GitHub) */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50">
            <h2 className="text-xl font-black flex items-center gap-3 italic text-slate-800 uppercase text-[12px] tracking-widest mb-8">
              <BookOpen className="text-teal-600" /> Mes Manuscrits ({myTexts.length})
            </h2>
            
            <div className="space-y-4">
              {myTexts.length > 0 ? myTexts.map((txt) => (
                <Link href={`/texts/${txt.id}`} key={txt.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900 group-hover:text-teal-600 transition-colors">{txt.title}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(txt.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-6 text-slate-400">
                    <div className="flex items-center gap-1.5"><Eye size={14}/> <span className="text-xs font-black text-slate-600">{txt.views || 0}</span></div>
                    <div className="flex items-center gap-1.5"><Heart size={14}/> <span className="text-xs font-black text-slate-600">{txt.likes?.length || 0}</span></div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-10 text-slate-300 font-black uppercase text-[10px] tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">
                  Le parchemin est encore vierge...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION PAIEMENT */}
        <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl h-fit sticky top-10 border border-slate-800">
          <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8">
            <CreditCard size={24} /> Versements
          </h2>
          
          <div className="space-y-6">
            <select disabled={!editingPayment} value={payment.method} onChange={e => setPayment({...payment, method: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-white outline-none ring-teal-500/30 focus:ring-2">
              <option value="PayPal">PayPal</option>
              <option value="Western Union">Western Union</option>
              <option value="MoneyGram">MoneyGram</option>
            </select>

            {payment.method === "PayPal" ? (
              <input type="email" disabled={!editingPayment} value={payment.paypalEmail} onChange={e => setPayment({...payment, paypalEmail: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold text-teal-400 outline-none" placeholder="Email PayPal" />
            ) : (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <input type="text" disabled={!editingPayment} placeholder="Prénom du bénéficiaire" value={payment.wuFirstName} onChange={e => setPayment({...payment, wuFirstName: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold" />
                <input type="text" disabled={!editingPayment} placeholder="Nom du bénéficiaire" value={payment.wuLastName} onChange={e => setPayment({...payment, wuLastName: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold" />
                <input type="text" disabled={!editingPayment} placeholder="Pays" value={payment.country} onChange={e => setPayment({...payment, country: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold" />
                <input type="text" disabled={!editingPayment} placeholder="Téléphone" value={payment.phone} onChange={e => setPayment({...payment, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-sm font-bold" />
              </div>
            )}
            
            <div className="pt-4">
              {editingPayment ? (
                <button onClick={saveAllToStaffRegistry} className="w-full py-5 bg-teal-500 text-slate-950 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition-all">
                  Confirmer les coordonnées
                </button>
              ) : (
                <button onClick={() => setEditingPayment(true)} className="w-full py-5 bg-slate-800 text-teal-400 rounded-[1.5rem] font-black text-[10px] uppercase border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
                  <Edit3 size={16} /> Modifier les infos
                </button>
              )}
            </div>
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
        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-100 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all text-slate-700 shadow-inner" 
      />
    </div>
  );
}
