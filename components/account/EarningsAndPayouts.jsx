import React, { useEffect, useState } from "react";

export default function EarningsAndPayouts({ userId }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`/api/earnings/summary?userId=${userId}`)
      .then((r) => r.json())
      .then(setSummary);
  }, [userId]);

  if (!summary) return <div>Chargement…</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Gains</h2>
      <p>Total : {summary.total} {summary.currency}</p>
      <p>Dernier versement : {summary.lastPayout}</p>
    </div>
  );
}
