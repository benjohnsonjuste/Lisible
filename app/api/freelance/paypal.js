// Intégration PayPal (API REST v2) pour l'Espace Freelance.
// - En mode réel, l'argent est capturé sur le compte PayPal propriétaire des identifiants API.
// - Sans identifiants : MODE DÉMO — aucune requête réseau, identifiants simulés préfixés DEMO-.
// L'interface doit afficher clairement « Mode test — aucun argent réel » en mode démo.

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const MODE = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
export const CURRENCY = process.env.PAYPAL_CURRENCY || "CAD";

// Les paiements réels sont possibles uniquement si les deux identifiants sont configurés.
export const paymentsEnabled = () => Boolean(CLIENT_ID && CLIENT_SECRET);
export const isDemo = () => !paymentsEnabled();
export const paypalMode = () => (isDemo() ? "demo" : MODE);

const BASE_URL = () => (MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

// Erreur explicite quand l'API Payouts n'est pas activée sur le compte PayPal.
export class PayoutsDisabledError extends Error {
  constructor(message) {
    super(message);
    this.name = "PayoutsDisabledError";
    this.code = "PAYOUTS_DISABLED";
  }
}

// Jeton d'accès mis en cache en mémoire (best-effort).
let tokenCache = { token: null, expiresAt: 0 };

export async function getAccessToken() {
  if (isDemo()) throw new Error("Mode démo : aucun jeton PayPal réel.");
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60000) return tokenCache.token;
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE_URL()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PayPal : authentification impossible (${res.status}). Vérifiez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET.`);
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
    err.details = data.details || data;
    throw err;
  }
  return data;
}

const fmtAmount = (n) => Number(n).toFixed(2);

// Crée une commande de paiement → {orderId, approveUrl}.
// Le client est redirigé vers approveUrl pour approuver le paiement sur PayPal.
export async function createOrder(amount, returnUrl, cancelUrl, description) {
  const order = await paypalFetch("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: CURRENCY, value: fmtAmount(amount) },
          description: description || "Mission Espace Freelance — Lisible",
        },
      ],
      application_context: {
        brand_name: "Lisible",
        locale: "fr-CA",
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: "PAY_NOW",
      },
    }),
  });
  const approveUrl = (order.links || []).find((l) => l.rel === "approve")?.href;
  if (!approveUrl) throw new Error("PayPal : lien d'approbation introuvable.");
  return { orderId: order.id, approveUrl };
}

// Capture une commande approuvée → {captureId, amount}.
// L'argent arrive sur le compte PayPal propriétaire des identifiants API (séquestre).
export async function captureOrder(orderId) {
  const data = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, { method: "POST", body: "{}" });
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture || !capture.id) throw new Error("PayPal : capture impossible (commande non approuvée ?).");
  return { captureId: capture.id, amount: Number(capture.amount?.value || 0) };
}

// Rembourse une capture (total ou partiel si amount précisé) → {refundId}.
export async function refundCapture(captureId, amount) {
  const body = amount ? { amount: { currency_code: CURRENCY, value: fmtAmount(amount) } } : {};
  const data = await paypalFetch(`/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { refundId: data.id };
}

// Envoie un paiement au professionnel via l'API Payouts → {batchId}.
// Lève PayoutsDisabledError si les Payouts ne sont pas activés sur le compte.
export async function createPayout(recipientEmail, amount, note) {
  const batchId = `lisible_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const data = await paypalFetch("/v1/payments/payouts", {
      method: "POST",
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: batchId,
          email_subject: "Paiement de votre mission — Lisible",
          email_message: note || "Merci pour votre travail sur Lisible.",
        },
        items: [
          {
            recipient_type: "EMAIL",
            amount: { value: fmtAmount(amount), currency: CURRENCY },
            receiver: recipientEmail,
            note: note || "Paiement mission Lisible",
            sender_item_id: `mission_${Date.now()}`,
          },
        ],
      }),
    });
    const batch = data?.batch_header;
    return { batchId: batch?.payout_batch_id || batchId };
  } catch (e) {
    // 403 = Payouts non activés / non autorisés pour ces identifiants
    if (e.status === 403) {
      throw new PayoutsDisabledError(
        "Les versements automatiques (Payouts) ne sont pas activés sur ce compte PayPal. " +
          "Activez « Payouts » dans votre espace développeur PayPal, ou réglez le paiement manuellement depuis l'administration."
      );
    }
    throw e;
  }
}
