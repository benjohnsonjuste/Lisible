"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import MetricsOverview from "@/components/MetricsOverview";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Infos de profil
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [penName, setPenName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [profilePic, setProfilePic] = useState("/avatar.png");

  // Paiement
  const [paymentMethod, setPaymentMethod] = useState("PayPal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [wuMoneyGram, setWuMoneyGram] = useState({
    firstName: "",
    lastName: "",
    country: "",
    areaCode: "",
    phone: "",
  });
  const [editingPayment, setEditingPayment] = useState(false);

  // Charger l’utilisateur depuis GitHub/localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("lisibleUser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setFirstName(parsed.firstName || "");
      setLastName(parsed.lastName || "");
      setPenName(parsed.penName || "");
      setBirthday(parsed.birthday || "");
      setProfilePic(parsed.profilePic || "/avatar.png");
      setPaymentMethod(parsed.paymentMethod || "PayPal");
      setPaypalEmail(parsed.paypalEmail || "");
      setWuMoneyGram(parsed.wuMoneyGram || {});
      setEditingPayment(!!parsed.paymentMethod);
    }
    setLoading(false);
  }, []);

  // Sauvegarde du profil général
  const handleSaveProfile = async () => {
    if (!firstName || !lastName) {
      toast.error("Nom et Prénom requis");
      return;
    }
    const payload = {
      uid: user.uid,
      firstName,
      lastName,
      penName,
      birthday,
      profilePic,
    };
    try {
      const res = await fetch("/api/save-user-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec sauvegarde");
      localStorage.setItem("lisibleUser", JSON.stringify({ ...user, ...payload }));
      setUser(prev => ({ ...prev, ...payload }));
      toast.success("✅ Profil sauvegardé !");
    } catch (err) {
      console.error(err);
      toast.error("❌ Impossible de sauvegarder le profil");
    }
  };

  // Sauvegarde des infos de paiement
  const handleSavePayment = async () => {
    if (!user) {
      toast.error("Utilisateur non connecté");
      return;
    }
    if (paymentMethod === "PayPal" && !paypalEmail) {
      toast.error("Adresse PayPal requise");
      return;
    }
    if ((paymentMethod === "Western Union" || paymentMethod === "MoneyGram") &&
        (!wuMoneyGram.firstName || !wuMoneyGram.lastName || !wuMoneyGram.country || !wuMoneyGram.areaCode || !wuMoneyGram.phone)) {
      toast.error("Tous les champs du mode de paiement doivent être remplis");
      return;
    }
    const payload = {
      uid: user.uid,
      paymentMethod,
      paypalEmail: paymentMethod === "PayPal" ? paypalEmail : "",
      wuMoneyGram: (paymentMethod === "Western Union" || paymentMethod === "MoneyGram") ? wuMoneyGram : {},
    };
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Échec sauvegarde");
      localStorage.setItem("lisibleUser", JSON.stringify({ ...user, ...payload }));
      setUser(prev => ({ ...prev, ...payload }));
      setEditingPayment(true);
      toast.success("✅ Informations de paiement sauvegardées !");
    } catch (err) {
      console.error(err);
      toast.error("❌ Impossible de sauvegarder les informations de paiement");
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">⚙️ Mon compte</h1>

      {/* Section Profil */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Profil</h2>
        <div className="flex items-center gap-4 mb-4">
          <img src={profilePic || "/avatar.png"} className="w-20 h-20 rounded-full object-cover border" />
          <input type="file" accept="image/*" onChange={e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => setProfilePic(ev.target.result);
            reader.readAsDataURL(file);
          }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Nom *</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border rounded p-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Prénom *</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border rounded p-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Nom de plume</label>
            <input type="text" value={penName} onChange={e => setPenName(e.target.value)} className="w-full border rounded p-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Date d'anniversaire</label>
            <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full border rounded p-2"/>
          </div>
        </div>
        <button onClick={handleSaveProfile} className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4">Sauvegarder Profil</button>
      </div>

      {/* Section Paiement */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Paiement</h2>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border rounded p-2" disabled={editingPayment}>
          <option>PayPal</option>
          <option>Western Union</option>
          <option>MoneyGram</option>
        </select>

        {paymentMethod === "PayPal" && (
          <div className="mt-4">
            <label className="block text-sm font-medium">Adresse PayPal *</label>
            <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} className="w-full border rounded p-2" disabled={editingPayment}/>
          </div>
        )}

        {(paymentMethod === "Western Union" || paymentMethod === "MoneyGram") && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium">Nom *</label>
              <input type="text" value={wuMoneyGram.firstName} onChange={e => setWuMoneyGram({...wuMoneyGram, firstName: e.target.value})} className="w-full border rounded p-2" disabled={editingPayment}/>
            </div>
            <div>
              <label className="block text-sm font-medium">Prénom *</label>
              <input type="text" value={wuMoneyGram.lastName} onChange={e => setWuMoneyGram({...wuMoneyGram, lastName: e.target.value})} className="w-full border rounded p-2" disabled={editingPayment}/>
            </div>
            <div>
              <label className="block text-sm font-medium">Pays *</label>
              <input type="text" value={wuMoneyGram.country} onChange={e => setWuMoneyGram({...wuMoneyGram, country: e.target.value})} className="w-full border rounded p-2" disabled={editingPayment}/>
            </div>
            <div>
              <label className="block text-sm font-medium">Area code *</label>
              <input type="text" value={wuMoneyGram.areaCode} onChange={e => setWuMoneyGram({...wuMoneyGram, areaCode: e.target.value})} className="w-full border rounded p-2" disabled={editingPayment}/>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Téléphone *</label>
              <input type="text" value={wuMoneyGram.phone} onChange={e => setWuMoneyGram({...wuMoneyGram, phone: e.target.value})} className="w-full border rounded p-2" disabled={editingPayment}/>
            </div>
          </div>
        )}

        {editingPayment ? (
          <button onClick={() => setEditingPayment(false)} className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 mt-4">Modifier</button>
        ) : (
          <button onClick={handleSavePayment} className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4">Enregistrer</button>
        )}
      </div>

      {/* Section Metrics */}
      {user && <MetricsOverview userId={user.uid} />}
    </div>
  );
}