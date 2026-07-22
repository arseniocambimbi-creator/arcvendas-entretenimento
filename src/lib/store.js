// Cliente da API da loja (Edge Functions no Supabase ARC STORE).
const SUPABASE_URL = "https://trdeibvrqqcbvvxbfrbp.supabase.co";
const SUPABASE_ANON = "sb_publishable_X458IfdW1eL5mq5iPgefMw_s616lGsd";
const FN = `${SUPABASE_URL}/functions/v1`;

async function callFn(name, body, extraHeaders = {}) {
  const res = await fetch(`${FN}/${name}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ---- Loja pública ----
export async function getCatalog() {
  const res = await fetch(`${FN}/store-catalog`, { headers: { apikey: SUPABASE_ANON } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data; // { settings, products }
}

export const createCheckout = (payload) => callFn("store-checkout", payload);
export const getOrderStatus = (orderId) => callFn("store-order-status", { order_id: orderId });

// ---- Painel admin (token) ----
export const admin = (action, payload, token) =>
  callFn("admin", { action, ...payload }, { "x-admin-token": token });

export const PAYMENT_METHODS = [
  { value: "multicaixa", label: "Multicaixa Express", needsPhone: true },
  { value: "reference", label: "Referência (Multicaixa / ATM)", needsPhone: false },
  { value: "stripe", label: "Cartão internacional (Visa/Mastercard)", needsPhone: false },
];
