import { useState, useEffect } from 'react';

export default function RevenueCalculator({ views }) {
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    setRevenue((views / 1000) * 0.2);
  }, [views]);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-bold mb-2">Revenus estimés</h3>
      <p className="text-xl font-semibold">${revenue.toFixed(2)}</p>
    </div>
  );
}
