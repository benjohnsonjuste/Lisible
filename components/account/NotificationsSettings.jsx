"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function NotificationSection({ user }) {
  const [emailNotif, setEmailNotif] = useState(false);
  const [newFollower, setNewFollower] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      const ref = doc(db, "notifications", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setEmailNotif(data.emailNotif || false);
        setNewFollower(data.newFollower || false);
      }
    };
    loadPrefs();
  }, [user]);

  const handleSave = async () => {
    const ref = doc(db, "notifications", user.uid);
    await setDoc(ref, { emailNotif, newFollower }, { merge: true });
    alert("🔔 Préférences enregistrées !");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={emailNotif}
            onChange={() => setEmailNotif(!emailNotif)}
          />
          Recevoir les mises à jour par email
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={newFollower}
            onChange={() => setNewFollower(!newFollower)}
          />
          Notification des nouveaux abonnés
        </label>

        <button
          onClick={handleSave}
          className="mt-4 bg-primary text-white rounded-lg px-4 py-2"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  );
}