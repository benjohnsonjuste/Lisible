import React, { useEffect, useState } from "react";

export default function PaymentMethods({ userId }) {
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    fetch(`/api/payments/methods?userId=${userId}`)
      .then((r) => r.json())
      .then(setMethods);
  }, [userId]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Méthodes de paiement</h2>
      <ul className="space-y-2">
        {methods.map((m) => (
          <li key={m.id} className="border p-3 rounded">
            {m.brand} •••• {m.last4} (exp. {m.expMonth}/{m.expYear})
          </li>
        ))}
      </ul>
    </div>
  );
}
