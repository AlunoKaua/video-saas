import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada.");
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil"
  });
}

export const CREDIT_PACKAGE_AMOUNT_CENTS = 1000;
export const CREDIT_PACKAGE_CURRENCY = "brl";
export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
export const SUBSCRIPTION_AMOUNT_CENTS = 2900;
export const SUBSCRIPTION_CURRENCY = "brl";
