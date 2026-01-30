"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, BookOpen, Eye, Heart, Plus,
  Lock, Trash2, AlertTriangle, RefreshCcw 
} from "lucide-react";
import MetricsOverview from "@/components/MetricsOverview";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [myTexts, setMyTexts] = useState([]);

  // États pour les formulaires
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: ""
  });

  // États pour la Sécurité
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [payment, setPayment] = useState({
    method: "PayPal", paypalEmail: "",
    wuFirstName: "", wuLastName: "", country: "", areaCode: "", phone: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
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
          if (parsed.email) await fetchAuthorTexts(parsed.email, parsed.penName || parsed.name);
        } else {
          router.push("/");
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    if (router.isReady) loadData();
  }, [router.isReady]);

  // --- CHANGEMENT DE MOT DE PASSE ---
  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new) return toast.error("Remplissez les deux champs");
    setIsChangingPass(true);
    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, currentPassword: passwords.current, newPassword: passwords.new }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Mot de passe mis à jour !");
        setPasswords({ current: "", new: "" });
      } else {
        throw new Error(data.error || "Échec de la mise à jour");
      }
    } catch (e) { toast.error(e.message); } finally { setIsChangingPass(false); }
  };

  // --- SUPPRESSION DE COMPTE ---
  const handleDeleteAccount = async () => {
    const confirm = window.confirm("ATTENTION : Cette action est irréversible. Vos publications et votre compte seront effacés. Continuer ?");
    if (!confirm) return;

    const loadingToast = toast.loading("Suppression définitive...");
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) {
        localStorage.clear();
        toast.success("Compte supprimé", { id: loadingToast });
        router.push("/");
      } else { throw new Error(); }
    } catch (e) { toast.error("Erreur lors de la suppression", { id: loadingToast }); }
  };

  const fetchAuthorTexts = async (email, penName) => {
    try {
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/publications?t=${Date.now()}`);
      if (!res.ok) return;
      const files = await res.json();
      const textPromises = files.filter(f => f.name.endsWith('.json')).map(file => fetch(file.download_url).then(r => r.json()));
      const allTexts = await Promise.all(textPromises);
      const filtered = allTexts.filter(t => t.authorEmail?.toLowerCase() === email.toLowerCase());
      setMyTexts(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (e) { console.error(e); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, profilePic: ev.target.result }));
      setIsUploading(false);
      toast.success("Photo prête");
    };
    reader.readAsDataURL(file);
  };

  const saveAllToStaffRegistry = async () => {
    const loadingToast = toast.loading("Mise à jour...");
    const updatedUserData = {
      ...user, ...formData, paymentMethod: payment.method, paypalEmail: payment.paypalEmail,
      wuMoneyGram: { ...payment }
    };
    try {
      const res = await fetch("/api/save-user-github", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUserData),
      });
      if (res.ok) {
        localStorage.setItem("lisible_user", JSON.stringify(updatedUserData));
        setUser(updatedUserData);
        toast.success("Profil mis à jour !", { id: loadingToast });
        setEditingPayment(false);
      }
    } catch (err) { toast.error("Échec", { id: loadingToast }); }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-white">
      <Loader2 className="animate-spin text-teal-600 mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accès au registre...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-500">
      {/* HEADER */}
      <header className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="p-4 bg-teal-50 rounded-2xl text-teal-600">
              <User size={32} strokeWidth={2.5} />
           </div>
           <div>
            <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">Mon Compte</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Registre Officiel Lisible</p>
          </div>
        </div>
        <button onClick={() => router.back()} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-teal-600 border border-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </button>
      </header>

      {user && <MetricsOverview user={user} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          
          {/* IDENTITÉ */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <h2 className="text-[11px] font-black flex items-center gap-3 italic text-slate-400 uppercase tracking-[0.3em]">
              <Edit3 className="text-teal-600" size={18} /> Profil Public & Civil
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
                   <ShieldCheck size={14} /> Membre Auteur Certifié
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
              <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
              <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
              <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <button onClick={saveAllToStaffRegistry} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-teal-600 transition-all shadow-xl active:scale-[0.98]">
              Enregistrer les modifications
            </button>
          </div>

          {/* SÉCURITÉ */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-8">
            <h2 className="text-[11px] font-black flex items-center gap-3 italic text-slate-400 uppercase tracking-[0.3em]">
              <Lock className="text-teal-600" size={18} /> Sécurité de l'accès
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2rem]">
              <InputBlock label="Mot de passe actuel" type="password" value={passwords.current} onChange={v => setPasswords({...passwords, current: v})} />
              <InputBlock label="Nouveau mot de passe" type="password" value={passwords.new} onChange={v => setPasswords({...passwords, new: v})} />
            </div>
            <button 
              onClick={handlePasswordChange}
              disabled={isChangingPass}
              className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex justify-center items-center gap-2"
            >
              {isChangingPass ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />} 
              Mettre à jour le mot de passe
            </button>
          </div>

          {/* MES MANUSCRITS */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h2 className="text-[11px] font-black flex items-center gap-3 italic text-slate-400 uppercase tracking-[0.3em]">
                <BookOpen className="text-teal-600" /> Mes Manuscrits ({myTexts.length})
              </h2>
              <Link href="/publish" className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-teal-500/20 active:scale-95">
                <Plus size={16} /> Nouveau Manuscrit
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {myTexts.length > 0 ? myTexts.map((txt) => (
                <Link href={`/texts/${txt.id}`} key={txt.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100 group">
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-slate-900 group-hover:text-teal-600 transition-colors">{txt.title}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Publié le {new Date(txt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex gap-4 sm:gap-6 text-slate-400">
                    <div className="flex items-center gap-1.5"><Eye size={14}/> <span className="text-xs font-black text-slate-700">{txt.views || 0}</span></div>
                    <div className="flex items-center gap-1.5"><Heart size={14} className="group-hover:text-rose-500 transition-colors" /> <span className="text-xs font-black text-slate-700">{txt.likes?.length || 0}</span></div>
                  </div>
                </Link>
              )) : (
                <div className="text-center py-16 text-slate-300 font-black uppercase text-[9px] tracking-[0.3em] border-2 border-dashed border-slate-100 rounded-[2rem]">Aucun manuscrit trouvé</div>
              )}
            </div>
          </div>

          {/* ZONE DANGEREUSE */}
          <div className="bg-rose-50/30 rounded-[3rem] p-10 border-2 border-dashed border-rose-100 space-y-6">
            <div className="flex items-center gap-4 text-rose-600">
               <AlertTriangle size={32} />
               <div>
                 <h3 className="font-black italic text-xl uppercase tracking-tighter leading-none">Zone de Danger</h3>
                 <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Action Irréversible</p>
               </div>
            </div>
            <button 
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg"
            >
              <Trash2 size={16} /> Supprimer mon compte
            </button>
          </div>
        </section>

        {/* VERSEMENTS */}
        <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl h-fit sticky top-10 border border-white/5">
          <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8">
            <CreditCard size={24} /> Versements
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Méthode préférée</label>
                <select disabled={!editingPayment} value={payment.method} onChange={e => setPayment({...payment, method: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-sm font-bold text-white outline-none ring-teal-500/30 focus:ring-2 transition-all">
                  <option value="PayPal">PayPal (Monde)</option>
                  <option value="Western Union">Western Union</option>
                  <option value="MoneyGram">MoneyGram</option>
                </select>
            </div>

            {payment.method === "PayPal" ? (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Email PayPal</label>
                <input type="email" disabled={!editingPayment} value={payment.paypalEmail} onChange={e => setPayment({...payment, paypalEmail: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-sm font-bold text-teal-400 outline-none" placeholder="votre@email.com" />
              </div>
            ) : (
              <div className="space-y-4">
                <InputBlockDark label="Prénom" value={payment.wuFirstName} onChange={v => setPayment({...payment, wuFirstName: v})} disabled={!editingPayment} />
                <InputBlockDark label="Nom" value={payment.wuLastName} onChange={v => setPayment({...payment, wuLastName: v})} disabled={!editingPayment} />
                <div className="grid grid-cols-2 gap-4">
                  <InputBlockDark label="Pays" value={payment.country} onChange={v => setPayment({...payment, country: v})} disabled={!editingPayment} />
                  <InputBlockDark label="Téléphone" value={payment.phone} onChange={v => setPayment({...payment, phone: v})} disabled={!editingPayment} />
                </div>
              </div>
            )}
            
            <div className="pt-6">
              {editingPayment ? (
                <button onClick={saveAllToStaffRegistry} className="w-full py-5 bg-teal-500 text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Confirmer</button>
              ) : (
                <button onClick={() => setEditingPayment(true)} className="w-full py-5 bg-slate-800 text-teal-400 rounded-xl font-black text-[10px] uppercase border border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-700 transition-all">
                  <Edit3 size={16} /> Modifier
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// COMPOSANTS RÉUTILISABLES
function InputBlock({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-2xl p-5 text-sm font-bold outline-none transition-all text-slate-700 shadow-sm" />
    </div>
  );
}

function InputBlockDark({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">{label}</label>
      <input disabled={disabled} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-teal-500 transition-all disabled:opacity-50" />
    </div>
  );
}
