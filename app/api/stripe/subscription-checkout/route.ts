import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { SUBSCRIPTION_AMOUNT_CENTS, SUBSCRIPTION_CURRENCY, SUBSCRIPTION_PRICE_ID, getStripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId || !email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [
      SUBSCRIPTION_PRICE_ID
        ? { price: SUBSCRIPTION_PRICE_ID, quantity: 1 }
        : {
            price_data: {
              currency: SUBSCRIPTION_CURRENCY,
              product_data: { name: "Assinatura Pro - vídeos longos" },
              unit_amount: SUBSCRIPTION_AMOUNT_CENTS,
              recurring: { interval: "month" }
            },
            quantity: 1
          }
    ],
    metadata: { userId },
    subscription_data: { metadata: { userId } },
    success_url: `${appUrl}/dashboard?subscription=success`,
    cancel_url: `${appUrl}/pricing?subscription=cancelled`
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "Stripe não retornou URL de checkout." }, { status: 502 });
  }

  return NextResponse.redirect(checkout.url, { status: 303 });
}
