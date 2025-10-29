"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [profilePic, setProfilePic] = useState("/avatar.png");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [penName, setPenName] = useState("");
  const [birthday, setBirthday] = useState("");

  // Paiement résumé
  const [paymentMethod, setPaymentMethod] = useState("PayPal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [wuMoneyGram, setWuMoneyGram] = useState({
    firstName: "",
    lastName: "",
    country: "",
    areaCode: "",
    phone: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("lisibleUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFirstName(parsedUser.firstName || "");
      setLastName(parsedUser.lastName || "");
      setPenName(parsedUser.penName || "");
      setBirthday(parsedUser.birthday || "");
      setProfilePic(parsedUser.profilePic || "/avatar.png");

      // Paiement résumé
      setPaymentMethod(parsedUser.paymentMethod || "PayPal");
      setPaypalEmail(parsedUser.paypalEmail || "");
      setWuMoneyGram(parsedUser.wuMoneyGram || {});

      if (parsedUser.subscribers) setSubscribers(parsedUser.subscribers);
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    if (!firstName || !lastName) return toast.error("Nom et Prénom sont requis.");

    const payload = {
      uid: user.uid,
      authorName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      penName,
      birthday,
      profilePic,
      subscribers,
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

  if (loading) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center">⚙️ Gestion du compte</h1>

      {/* Identification */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Identification</h2>

        <div className="flex items-center gap-4">
          <img
            src={profilePic}
            alt="Photo de profil"
            className="w-20 h-20 rounded-full object-cover border"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => setProfilePic(ev.target.result);
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Nom *</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Prénom *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Nom de plume</label>
            <input
              type="text"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Date d'anniversaire</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
        </div>
      </div>

      {/* Résumé Paiement */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">Mode de paiement</h2>

        <p className="text-gray-700">
          {paymentMethod === "PayPal" && `PayPal : ${paypalEmail || "Non renseigné"}`}
          {(paymentMethod === "Western Union" || paymentMethod === "MoneyGram") &&
            `WU/MoneyGram : ${wuMoneyGram.firstName || ""} ${wuMoneyGram.lastName || ""}, ${wuMoneyGram.country || ""}, Tel: ${wuMoneyGram.areaCode || ""}-${wuMoneyGram.phone || ""}`
          }
        </p>

        <button
          onClick={() => router.push("/payment")}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Modifier / Ajouter
        </button>
      </div>

      {/* Abonnés */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-xl font-semibold">
          Abonnés ({subscribers.length})
        </h2>
        {subscribers.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun abonné pour le moment.</p>
        ) : (
          <ul className="space-y-1">
            {subscribers.map((s, i) => (
              <li key={i} className="p-2 border rounded">
                {s.name} ({s.email})
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Sauvegarder
      </button>
    </div>
  );
}