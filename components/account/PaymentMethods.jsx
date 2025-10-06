"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function PaymentSection({ user }) {
  const [account, setAccount] = useState("");
  const [iban, setIban] = useState("");

  useEffect(() => {
    const fetchPayment = async () => {
      const ref = doc(db, "payments", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setAccount(data.account || "");
        setIban(data.iban || "");
      }
    };
    fetchPayment();
  }, [user]);

  const handleSave = async () => {
    const ref = doc(db, "payments", user.uid);
    await setDoc(ref, { account, iban }, { merge: true });
    alert("💰 Informations de paiement enregistrées !");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Paiements</h2>
      <div className="space-y-3">
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className="w-full border rounded-lg p-2"
          placeholder="Nom du compte"
        />
        <input
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          className="w-full border rounded-lg p-2"
          placeholder="IBAN / Compte"
        />
        <button
          onClick={handleSave}
          className="bg-primary text-white rounded-lg px-4 py-2"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}