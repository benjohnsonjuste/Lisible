"use client";

// Formate un montant en devise fr-CA (ex. : 85,00 $CA)
export function formatMontant(amount, currency = "CAD") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("fr-CA", { style: "currency", currency }).format(n);
  } catch {
    return `${n.toFixed(2)} $CA`;
  }
}

export default function Money({ amount, currency = "CAD", className = "" }) {
  return <span className={className}>{formatMontant(amount, currency)}</span>;
}
