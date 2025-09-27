import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebaseConfig";
import { doc, collection, onSnapshot, updateDoc, addDoc, query, where } from "firebase/firestore";

export default function MonetizationRealtime() {
  const user = auth.currentUser;
  const [authorData, setAuthorData] = useState(null);
  const [texts, setTexts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [paymentMode, setPaymentMode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [wuMgName, setWuMgName] = useState({ firstName: "", lastName: "", country: "", postalCode: "", phone: "" });
  const [withdrawMode, setWithdrawMode] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const countries = [
    { name: "Haiti", postalCode: "HT" },
    { name: "USA", postalCode: "US" },
    { name: "Canada", postalCode: "CA" },
    // Ajouter d'autres pays si nécessaire
  ];

  // Charger les données de l'auteur
  useEffect(() => {
    if (!user) return;

    const authorRef = doc(db, "authors", user.uid);
    const unsubscribeAuthor = onSnapshot(authorRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAuthorData(data);

        // Vérification abonnés >= 250
        if ((data.subscribers?.length || 0) < 250) return;

        // Stats journalières, hebdo, mensuelles
        setStats({
          daily: data.dailyViews || 0,
          weekly: data.weeklyViews || 0,
          monthly: data.monthlyViews || 0,
        });
      }
    });

    // Ecouter les textes pour calculer le solde en temps réel
    const textsQuery = query(collection(db, "texts"), where("authorId", "==", user.uid));
    const unsubscribeTexts = onSnapshot(textsQuery, (querySnap) => {
      const t = querySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTexts(t);

      const totalViews = t.reduce((sum, text) => sum + (text.views || 0), 0);
      setBalance((totalViews / 1000) * 0.2);
    });

    return () => {
      unsubscribeAuthor();
      unsubscribeTexts();
    };
  }, [user]);

  if (!user || !authorData) return null;
  if ((authorData.subscribers?.length || 0) < 250) return null;

  const handlePaymentConfirm = async () => {
    try {
      const docRef = doc(db, "authors", user.uid);
      if (paymentMode === "PayPal") {
        await updateDoc(docRef, { payment: { mode: "PayPal", paypalEmail } });
        alert("PayPal confirmé !");
      } else {
        await updateDoc(docRef, { payment: { mode: paymentMode, ...wuMgName } });
        alert(`${paymentMode} confirmé !`);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la confirmation du paiement.");
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Montant invalide");
      return;
    }
    if (amount > balance) {
      alert("Le montant ne doit pas dépasser le solde disponible");
      return;
    }

    try {
      await addDoc(collection(db, "withdrawRequests"), {
        authorId: user.uid,
        mode: withdrawMode,
        amount,
        createdAt: new Date(),
        status: "pending",
      });
      alert("Votre demande est prise en compte. Surveillez la cloche de notification pour suivre la mise à jour.");
      setWithdrawAmount("");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la demande de retrait.");
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-4">Monétisation activée</h2>

      {/* Statistiques */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Statistiques en temps réel</h3>
        <p>Vues journalières : {stats.daily}</p>
        <p>Vues hebdomadaires : {stats.weekly}</p>
        <p>Vues mensuelles : {stats.monthly}</p>
        <p>Solde disponible : ${balance.toFixed(2)}</p>
      </div>

      {/* Choix du mode de paiement */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Mode de paiement</h3>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        >
          <option value="">-- Choisir un mode --</option>
          <option value="PayPal">PayPal</option>
          <option value="Western-union">Western-union</option>
          <option value="MoneyGram">MoneyGram</option>
        </select>

        {paymentMode === "PayPal" && (
          <input
            type="email"
            placeholder="Adresse PayPal"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          />
        )}

        {(paymentMode === "Western-union" || paymentMode === "MoneyGram") && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Prénom"
              value={wuMgName.firstName}
              onChange={(e) => setWuMgName({ ...wuMgName, firstName: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <input
              type="text"
              placeholder="Nom"
              value={wuMgName.lastName}
              onChange={(e) => setWuMgName({ ...wuMgName, lastName: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <select
              value={wuMgName.country}
              onChange={(e) => {
                const country = countries.find(c => c.name === e.target.value);
                setWuMgName({ ...wuMgName, country: e.target.value, postalCode: country?.postalCode || "" });
              }}
              className="border p-2 rounded w-full"
            >
              <option value="">-- Choisir un pays --</option>
              {countries.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Numéro de téléphone"
              value={wuMgName.phone}
              onChange={(e) => setWuMgName({ ...wuMgName, phone: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>
        )}

        <button
          onClick={handlePaymentConfirm}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
        >
          Confirmer
        </button>
      </div>

      {/* Effectuer un retrait */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Effectuer un retrait</h3>
        <select
          value={withdrawMode}
          onChange={(e) => setWithdrawMode(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        >
          <option value="">-- Choisir un mode --</option>
          <option value="PayPal">PayPal</option>
          <option value="Western-union">Western-union</option>
          <option value="MoneyGram">MoneyGram</option>
        </select>
        <input
          type="number"
          placeholder="Montant à retirer"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={handleWithdraw}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Confirmer
        </button>
      </div>
    </div>
  );
}