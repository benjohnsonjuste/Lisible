"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PaymentPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState("PayPal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [wuMoneyGram, setWuMoneyGram] = useState({
    firstName: "",
    lastName: "",
    country: "",
    areaCode: "",
    phone: "",
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("lisibleUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setPaymentMethod(parsedUser.paymentMethod || "PayPal");
      setPaypalEmail(parsedUser.paypalEmail || "");
      setWuMoneyGram(parsedUser.wuMoneyGram || {});
      setEditing(!!parsedUser.paymentMethod); // si déjà rempli, afficher Modifier
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    if (!user) return toast.error("Utilisateur non connecté.");

    if (paymentMethod === "PayPal" && !paypalEmail)
      return toast.error("Adresse email PayPal requise.");

    if ((paymentMethod === "Western Union" || paymentMethod === "MoneyGram") &&
        (!wuMoneyGram.firstName || !wuMoneyGram.lastName || !wuMoneyGram.country || !wuMoneyGram.areaCode || !wuMoneyGram.phone)
    ) return toast.error("Tous les champs du mode de paiement doivent être remplis.");

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
      setEditing(true);
      toast.success("✔️ Informations de paiement sauvegardées !");
    } catch (err) {
      console.error("Erreur sauvegarde :", err);
      toast.error("❌ Impossible de sauvegarder les informations");
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">Paiement</h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Mode de paiement</h2>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border rounded p-2"
          disabled={!editing ? false : false}
        >
          <option>PayPal</option>
          <option>Western Union</option>
          <option>MoneyGram</option>
        </select>

        {paymentMethod === "PayPal" && (
          <div className="mt-4">
            <label className="block text-sm font-medium">Adresse email PayPal *</label>
            <input
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="w-full border rounded p-2"
              disabled={!editing}
            />
          </div>
        )}

        {(paymentMethod === "Western Union" || paymentMethod === "MoneyGram") && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {["firstName","lastName","country","areaCode","phone"].map((field, idx) => (
              <div key={idx} className={field==="phone"?"col-span-2":""}>
                <label className="block text-sm font-medium">{field==="firstName"?"Nom":field==="lastName"?"Prénom":field==="country"?"Pays":field==="areaCode"?"Area code":"Téléphone"} *</label>
                <input
                  type="text"
                  value={wuMoneyGram[field]}
                  onChange={(e) => setWuMoneyGram(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full border rounded p-2"
                  disabled={!editing}
                  required
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {editing ? (
        <button
          onClick={() => setEditing(false)}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
        >
          Modifier
        </button>
      ) : (
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Enregistrer
        </button>
      )}
    </div>
  );
}