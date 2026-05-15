export const MERCADO_PAGO_CREDIT_AMOUNT_CENTS = 1000;
export const MERCADO_PAGO_PREMIUM_AMOUNT_CENTS = 2500;
export const MERCADO_PAGO_CURRENCY = "BRL";
export const MERCADO_PAGO_PREMIUM_DAYS = 30;

type MercadoPagoPreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
};

type MercadoPagoPreferencePayload = {
  items: MercadoPagoPreferenceItem[];
  external_reference: string;
  metadata: Record<string, string>;
  notification_url: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: "approved";
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
    default_payment_method_id?: "pix";
  };
};

type MercadoPagoPreference = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  currency_id: string;
  transaction_amount: number;
  external_reference?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  metadata?: Record<string, unknown>;
};

function getAccessToken() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return accessToken;
}

async function mercadoPagoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago API error ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function createMercadoPagoPreference(payload: MercadoPagoPreferencePayload) {
  return mercadoPagoFetch<MercadoPagoPreference>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getMercadoPagoPayment(paymentId: string) {
  return mercadoPagoFetch<MercadoPagoPayment>(`/v1/payments/${paymentId}`);
}

export function shouldUseMercadoPagoSandbox() {
  return process.env.MERCADO_PAGO_USE_SANDBOX === "true";
}

export function isMercadoPagoWebhookSignatureConfigured() {
  return Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET);
}
