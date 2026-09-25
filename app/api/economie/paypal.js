// Intégration PayPal (API REST v2) pour l'achat de Li.
// Utilisée par les boutons intelligents PayPal : l'acheteur paie avec son
// compte PayPal OU par carte bancaire sans compte PayPal (guest checkout).
// Le crédit des Li est automatique : la commande est créée côté serveur,
// approuvée dans le widget PayPal, puis capturée côté serveur qui vérifie
// le montant avant de créditer.
//
// Requiert les secrets du Worker : PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
// (optionnel : PAYPAL_MODE = "live" | "sandbox", défaut "live").

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const MODE = (process.env.PAYPAL_MODE || "live").toLowerCase();
export const CURRENCY = "USD";

export const paymentsEnabled = () => Boolean(CLIENT_ID && CLIENT_SECRET);
export const paypalClientIdPublic = () => CLIENT_ID;

const BASE_URL = () =>
  MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

let tokenCache = { token: null, expiresAt: 0 };

export async function getAccessToken() {
  if (!paymentsEnabled()) throw new Error("PayPal non configuré (identifiants manquants).");
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60000) return tokenCache.token;
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE_URL()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error("PayPal : authentification impossible. Vérifiez les identifiants API.");
  }
  tokenCache = { token: data.access_token, expiresAt: now + (data.expires_in || 300) * 1000 };
  return tokenCache.token;
}

async function paypalFetch(path, options = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `PayPal : requête refusée (${res.status}).`);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

const fmtAmount = (n) => Number(n).toFixed(2);

// Crée une commande pour les boutons intelligents (pas de redirection : le
// widget PayPal l'approuve en place). Retourne l'identifiant de commande.
export async function createSmartOrder(amountUsd, description, customId) {
  const order = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: CURRENCY, value: fmtAmount(amountUsd) },
          description: description || "Achat de Li — Lisible",
          custom_id: customId || undefined,
        },
      ],
      application_context: {
        brand_name: "Lisible",
        locale: "fr-CA",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });
  if (!order.id) throw new Error("PayPal : création de commande impossible.");
  return { orderId: order.id, status: order.status };
}

// Capture une commande approuvée → { captureId, amount, status }.
// L'argent arrive sur le compte PayPal propriétaire des identifiants API.
export async function captureSmartOrder(orderId) {
  const data = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: "{}",
  });
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture || !capture.id) throw new Error("PayPal : capture impossible (commande non approuvée ?).");
  return {
    captureId: capture.id,
    amount: Number(capture.amount?.value || 0),
    currency: capture.amount?.currency_code,
    status: capture.status,
  };
}

// Lit une commande (pour la réconciliation) → { status, amount }.
export async function getSmartOrder(orderId) {
  const data = await paypalFetch(`/v2/checkout/orders/${orderId}`, { method: "GET" });
  const pu = data?.purchase_units?.[0];
  return {
    status: data.status,
    amount: Number(pu?.amount?.value || 0),
    currency: pu?.amount?.currency_code,
  };
}
