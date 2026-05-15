import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PAID_CREDITS } from "@/lib/download-quota";
import { prisma } from "@/lib/prisma";
import { CREDIT_PACKAGE_AMOUNT_CENTS, CREDIT_PACKAGE_CURRENCY, getStripe } from "@/lib/stripe";

type AppSubscriptionStatus = "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE";

function mapSubscriptionStatus(status: Stripe.Subscription.Status): AppSubscriptionStatus {
  if (status === "active" || status === "trialing") return "ACTIVE";
  if (status === "past_due") return "PAST_DUE";
  if (status === "canceled" || status === "unpaid") return "CANCELED";
  if (status === "incomplete" || status === "incomplete_expired") return "INCOMPLETE";
  return "NONE";
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

function getPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000) : null;
}

async function updateUserSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const stripeCustomerId = getCustomerId(subscription.customer);
  const data = {
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: mapSubscriptionStatus(subscription.status),
    subscriptionCurrentPeriodEnd: getPeriodEnd(subscription)
  };

  if (userId) {
    await prisma.user.update({ where: { id: userId }, data });
    return;
  }

  await prisma.user.updateMany({ where: { stripeSubscriptionId: subscription.id }, data });
}

async function handleCompletedPayment(checkout: Stripe.Checkout.Session) {
  const userId = checkout.metadata?.userId;
  const amount = checkout.amount_total;
  const currency = checkout.currency?.toLowerCase();

  if (amount !== CREDIT_PACKAGE_AMOUNT_CENTS || currency !== CREDIT_PACKAGE_CURRENCY) {
    return NextResponse.json({ error: "Pagamento não corresponde ao pacote configurado." }, { status: 400 });
  }

  if (!userId || !checkout.id) return null;

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { stripeSessionId: checkout.id } });

    if (purchase?.status === "PAID") {
      return;
    }

    await tx.purchase.upsert({
      where: { stripeSessionId: checkout.id },
      create: {
        userId,
        stripeSessionId: checkout.id,
        stripePaymentId: typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
        amount,
        currency,
        creditsGranted: PAID_CREDITS,
        status: "PAID"
      },
      update: {
        stripePaymentId: typeof checkout.payment_intent === "string" ? checkout.payment_intent : null,
        status: "PAID"
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: { downloadCredits: { increment: PAID_CREDITS } }
    });
  });

  return null;
}

async function handleCompletedSubscription(checkout: Stripe.Checkout.Session) {
  const userId = checkout.metadata?.userId;
  const subscriptionId = typeof checkout.subscription === "string" ? checkout.subscription : checkout.subscription?.id;

  if (!userId || !subscriptionId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: getCustomerId(checkout.customer),
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "INCOMPLETE"
    }
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object as Stripe.Checkout.Session;

    if (checkout.mode === "payment") {
      const response = await handleCompletedPayment(checkout);
      if (response) return response;
    }

    if (checkout.mode === "subscription") {
      await handleCompletedSubscription(checkout);
    }
  }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    await updateUserSubscription(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}
