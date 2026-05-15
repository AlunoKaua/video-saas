import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { PAID_CREDITS } from "@/lib/download-quota";
import { prisma } from "@/lib/prisma";
import { CREDIT_PACKAGE_AMOUNT_CENTS, CREDIT_PACKAGE_CURRENCY, getStripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const email = session?.user?.email;

  if (!userId || !email) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL ?? "http://localhost:3000"));
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const configuredPriceId = process.env.STRIPE_PRICE_ID;
  const lineItem = configuredPriceId?.startsWith("price_")
    ? { price: configuredPriceId, quantity: 1 }
    : {
        price_data: {
          currency: CREDIT_PACKAGE_CURRENCY,
          product_data: { name: `${PAID_CREDITS} créditos de download` },
          unit_amount: CREDIT_PACKAGE_AMOUNT_CENTS
        },
        quantity: 1
      };
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [lineItem],
    metadata: {
      userId,
      credits: String(PAID_CREDITS)
    },
    success_url: `${appUrl}/dashboard?payment=success`,
    cancel_url: `${appUrl}/pricing?payment=cancelled`
  });

  await prisma.purchase.create({
    data: {
      userId,
      stripeSessionId: checkout.id,
      amount: CREDIT_PACKAGE_AMOUNT_CENTS,
      currency: CREDIT_PACKAGE_CURRENCY,
      creditsGranted: PAID_CREDITS,
      status: "PENDING"
    }
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "Stripe não retornou URL de checkout." }, { status: 502 });
  }

  return NextResponse.redirect(checkout.url, { status: 303 });
}
