import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PREMIUM_CREDITS } from "@/lib/download-quota";
import { authOptions } from "@/lib/auth";
import { createMercadoPagoPreference, MERCADO_PAGO_CURRENCY, MERCADO_PAGO_PREMIUM_AMOUNT_CENTS, MERCADO_PAGO_PREMIUM_DAYS } from "@/lib/mercado-pago";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const appUrl = process.env.NEXTAUTH_URL;
  if (!appUrl) {
    return NextResponse.json({ error: "NEXTAUTH_URL não configurado." }, { status: 500 });
  }

  const purchase = await prisma.purchase.create({
    data: {
      userId,
      provider: "MERCADO_PAGO",
      kind: "PREMIUM_30_DAYS",
      amount: MERCADO_PAGO_PREMIUM_AMOUNT_CENTS,
      currency: MERCADO_PAGO_CURRENCY,
      creditsGranted: PREMIUM_CREDITS,
      premiumDaysGranted: MERCADO_PAGO_PREMIUM_DAYS,
      status: "PENDING"
    }
  });

  const preference = await createMercadoPagoPreference({
    items: [
      {
        title: "Premium por 30 dias + 40 créditos",
        quantity: 1,
        unit_price: MERCADO_PAGO_PREMIUM_AMOUNT_CENTS / 100,
        currency_id: MERCADO_PAGO_CURRENCY
      }
    ],
    external_reference: purchase.id,
    metadata: {
      userId,
      purchaseId: purchase.id,
      kind: "PREMIUM_30_DAYS"
    },
    notification_url: `${appUrl}/api/mercado-pago/webhook`,
    back_urls: {
      success: `${appUrl}/dashboard?premium=success`,
      failure: `${appUrl}/pricing?premium=failure`,
      pending: `${appUrl}/pricing?premium=pending`
    },
    payment_methods: {
      excluded_payment_methods: [
        { id: "bolbradesco" },
        { id: "pec" },
        { id: "visa" },
        { id: "master" },
        { id: "amex" },
        { id: "elo" },
        { id: "hipercard" }
      ],
      excluded_payment_types: [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }, { id: "atm" }],
      installments: 1
    }
  });

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { mercadoPagoPreferenceId: preference.id }
  });

  const redirectUrl = preference.init_point || preference.sandbox_init_point;
  if (!redirectUrl) {
    return NextResponse.json({ error: "Mercado Pago não retornou URL de checkout." }, { status: 500 });
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
