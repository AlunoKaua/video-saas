import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PAID_CREDITS } from "@/lib/download-quota";
import { authOptions } from "@/lib/auth";
import { createMercadoPagoPreference, MERCADO_PAGO_CREDIT_AMOUNT_CENTS, MERCADO_PAGO_CURRENCY } from "@/lib/mercado-pago";
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
      kind: "CREDITS",
      amount: MERCADO_PAGO_CREDIT_AMOUNT_CENTS,
      currency: MERCADO_PAGO_CURRENCY,
      creditsGranted: PAID_CREDITS,
      status: "PENDING"
    }
  });

  const preference = await createMercadoPagoPreference({
    items: [
      {
        title: "10 créditos de download",
        quantity: 1,
        unit_price: MERCADO_PAGO_CREDIT_AMOUNT_CENTS / 100,
        currency_id: MERCADO_PAGO_CURRENCY
      }
    ],
    external_reference: purchase.id,
    metadata: {
      userId,
      purchaseId: purchase.id,
      kind: "CREDITS"
    },
    notification_url: `${appUrl}/api/mercado-pago/webhook`,
    back_urls: {
      success: `${appUrl}/dashboard?payment=success`,
      failure: `${appUrl}/pricing?payment=failure`,
      pending: `${appUrl}/pricing?payment=pending`
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
