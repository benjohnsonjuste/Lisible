"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { 
  User, CreditCard, Camera, Edit3, ArrowLeft, 
  ShieldCheck, Loader2, Save, Wallet, Sparkles,
  BookOpen, Star, TrendingUp, Download, Mail, 
  Landmark, Key, Trash2, Share2, CheckCircle2
} from "lucide-react";

function AccountStatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: color, size: 20 })}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
          <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", penName: "", birthday: "", profilePic: "",
    paymentMethod: "PayPal", paypalEmail: "", wuFirstName: "", wuLastName: "", wuCountry: ""
  });

  const [passData, setPassData] = useState({ current: "", new: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("lisible_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        refreshUserData(parsed.email);
      } catch (e) { router.push("/login"); }
    } else { router.push("/login"); }
  }, []);

  const refreshUserData = async (email) => {
    try {
      const fileName = btoa(email.toLowerCase().trim()).replace(/=/g, "");
      const res = await fetch(`https://api.github.com/repos/benjohnsonjuste/Lisible/contents/data/users/${fileName}.json?t=${Date.now()}`);
      if (res.ok) {
        const file = await res.json();
        const freshUser = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
        setUser(freshUser);
        setFormData({
          firstName: freshUser.firstName || "",
          lastName: freshUser.lastName || "",
          penName: freshUser.penName || freshUser.name || "",
          birthday: freshUser.birthday || "",
          profilePic: freshUser.profilePic || "",
          paymentMethod: freshUser.paymentMethod || "PayPal",
          paypalEmail: freshUser.paypalEmail || "",
          wuFirstName: freshUser.wuMoneyGram?.firstName || "",
          wuLastName: freshUser.wuMoneyGram?.lastName || "",
          wuCountry: freshUser.wuMoneyGram?.country || ""
        });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDownloadBadge = async () => {
    const t = toast.loading("Génération du badge...");
    const badgeElement = document.createElement("div");
    badgeElement.style.position = "absolute";
    badgeElement.style.left = "-9999px";
    badgeElement.innerHTML = `
      <div id="capture-badge" style="width:400px; height:400px; background:white; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; border:15px solid #0f172a; padding:40px; font-family:sans-serif;">
        <img src="/icon-192.png" style="width:70px; margin-bottom:20px;"/>
        <p style="color:#0d9488; font-weight:900; text-transform:uppercase; letter-spacing:3px; font-size:12px; margin-bottom:10px;">Compte Officiel</p>
        <h2 style="font-size:32px; font-weight:900; text-transform:uppercase; margin:0; color:#0f172a;">${formData.firstName} ${formData.lastName}</h2>
        <p style="color:#94a3b8; font-size:12px; margin-top:5px;">${user.email}</p>
        <div style="margin-top:40px; border-top:1px solid #e2e8f0; width:100%; padding-top:20px;">
          <p style="font-weight:900; letter-spacing:2px; text-transform:uppercase; font-size:14px;">lisible.biz</p>
        </div>
      </div>
    `;
    document.body.appendChild(badgeElement);
    try {
      const canvas = await html2canvas(document.getElementById("capture-badge"), { scale: 3, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `Badge_Officiel_${formData.penName}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Badge téléchargé !", { id: t });
    } catch (err) { toast.error("Erreur", { id: t }); }
    document.body.removeChild(badgeElement);
  };

  const handleShare = (platform) => {
    const text = encodeURIComponent("J'ai mon compte officiel sur lisible.biz, passe me visiter !");
    const url = encodeURIComponent("https://lisible.biz");
    const links = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
    };
    window.open(links[platform], "_blank");
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const t = toast.loading("Mise à jour...");
    try {
      const updatedUser = { ...user, ...formData, wuMoneyGram: { firstName: formData.wuFirstName, lastName: formData.wuLastName, country: formData.wuCountry } };
      const res = await fetch('/api/update-user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, userData: updatedUser }) });
      if (res.ok) {
        localStorage.setItem("lisible_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Enregistré", { id: t });
      }
    } catch (e) { toast.error("Erreur", { id: t }); } finally { setIsSaving(false); }
  };

  if (loading || !user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 pb-20">
      <header className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-900/20"><User size={30} /></div>
           <div><h1 className="text-3xl font-black italic tracking-tighter">Mon Compte</h1><p className="text-slate-400 font-bold text-[9px] uppercase mt-1 tracking-widest">Identité & Portefeuille</p></div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDownloadBadge} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-100 transition-all" title="Télécharger mon Badge"><Download size={20} /></button>
          <button onClick={() => router.back()} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-all"><ArrowLeft size={20} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AccountStatCard label="Lectures Li" value={user?.stats?.totalCertified || 0} icon={<Sparkles />} color="text-teal-600" />
        <AccountStatCard label="Manuscrits" value={user?.stats?.totalTexts || 0} icon={<BookOpen />} color="text-blue-600" />
        <AccountStatCard label="Influence" value={user?.stats?.subscribers || 0} icon={<Star />} color="text-amber-500" />
        <AccountStatCard label="Visibilité" value={user?.stats?.totalViews || 0} icon={<TrendingUp />} color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-50 space-y-10">
            <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="relative">
                  <img src={formData.profilePic || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${user.email}`} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl" alt="Profil" />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-teal-600 transition-all"><Camera size={18} /><input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({ ...formData, profilePic: reader.result });
                        reader.readAsDataURL(file);
                      }
                  }} /></label>
               </div>
               <div className="text-center sm:text-left">
                  <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{formData.penName || "Auteur"}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleShare('whatsapp')} className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-[8px] font-black uppercase tracking-widest">WhatsApp</button>
                    <button onClick={() => handleShare('facebook')} className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Facebook</button>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <InputBlock label="Prénom" value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
                <InputBlock label="Nom" value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
                <InputBlock label="Nom de plume" value={formData.penName} onChange={v => setFormData({...formData, penName: v})} />
                <InputBlock label="Date de naissance" value={formData.birthday} onChange={v => setFormData({...formData, birthday: v})} type="date" />
            </div>

            <hr className="border-slate-100" />
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => setFormData({...formData, paymentMethod: "PayPal"})} className={`p-6 rounded-2xl border-2 transition-all font-black text-[10px] ${formData.paymentMethod === "PayPal" ? "border-teal-500 bg-teal-50" : "border-slate-50 opacity-40"}`}>PAYPAL</button>
               <button onClick={() => setFormData({...formData, paymentMethod: "Western Union"})} className={`p-6 rounded-2xl border-2 transition-all font-black text-[10px] ${formData.paymentMethod === "Western Union" ? "border-teal-500 bg-teal-50" : "border-slate-50 opacity-40"}`}>WESTERN UNION</button>
            </div>

            {formData.paymentMethod === "PayPal" ? <InputBlock label="Email PayPal" value={formData.paypalEmail} onChange={v => setFormData({...formData, paypalEmail: v})} /> : 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><InputBlock label="Prénom" value={formData.wuFirstName} onChange={v => setFormData({...formData, wuFirstName: v})} /><InputBlock label="Nom" value={formData.wuLastName} onChange={v => setFormData({...formData, wuLastName: v})} /><div className="sm:col-span-2"><InputBlock label="Pays" value={formData.wuCountry} onChange={v => setFormData({...formData, wuCountry: v})} /></div></div>}

            <button disabled={isSaving} onClick={saveProfile} className="w-full py-6 bg-slate-950 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-teal-600 transition-all flex justify-center items-center gap-3">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Mettre à jour mon profil
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="bg-slate-950 rounded-[3rem] p-8 text-white shadow-2xl sticky top-24">
            <h2 className="text-xl font-black flex items-center gap-3 text-teal-400 italic mb-8"><CreditCard size={24} /> Trésorerie</h2>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Solde</p>
                 <p className="text-2xl font-black italic">{user?.wallet?.balance?.toLocaleString() || 0} Li</p>
                 <p className="text-[10px] text-teal-400 font-black mt-1 uppercase">$ {(user?.wallet?.balance * 0.0002).toFixed(2)} USD</p>
              </div>
              <button disabled className="w-full py-5 bg-slate-800 text-slate-600 rounded-2xl font-black text-[10px] uppercase opacity-50 cursor-not-allowed">Retrait (Min. 25k Li)</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InputBlock({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 focus:border-teal-200 focus:bg-white rounded-[1.2rem] p-5 text-sm font-bold outline-none transition-all text-slate-900" />
    </div>
  );
}
