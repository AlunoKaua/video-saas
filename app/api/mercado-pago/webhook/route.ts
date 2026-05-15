import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPayment, isMercadoPagoWebhookSignatureConfigured, MERCADO_PAGO_CURRENCY, shouldUseMercadoPagoSandbox } from "@/lib/mercado-pago";
import { prisma } from "@/lib/prisma";

function centsFromAmount(amount: number) {
  return Math.round(amount * 100);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getPaymentId(body: unknown, request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromQuery = searchParams.get("id") || searchParams.get("data.id");
  if (fromQuery) return fromQuery;

  if (body && typeof body === "object" && "data" in body) {
    const data = (body as { data?: unknown }).data;
    if (data && typeof data === "object" && "id" in data) {
      const id = (data as { id?: unknown }).id;
      if (typeof id === "string" || typeof id === "number") return String(id);
    }
  }

  return null;
}

function looksLikePaymentId(paymentId: string) {
  return /^\d+$/.test(paymentId);
}

function hasRequiredSignatureHeaders(request: NextRequest) {
  if (!isMercadoPagoWebhookSignatureConfigured()) return true;
  return Boolean(request.headers.get("x-signature") && request.headers.get("x-request-id"));
}

export async function POST(request: NextRequest) {
  if (!hasRequiredSignatureHeaders(request)) {
    return NextResponse.json({ error: "Assinatura Mercado Pago ausente." }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const paymentId = getPaymentId(body, request);
  if (!paymentId || !looksLikePaymentId(paymentId)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  let payment;
  try {
    payment = await getMercadoPagoPayment(paymentId);
  } catch {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (payment.status !== "approved") {
    return NextResponse.json({ received: true, status: payment.status });
  }

  const isPix = payment.payment_type_id === "bank_transfer" && payment.payment_method_id === "pix";
  const isSandboxBalance = shouldUseMercadoPagoSandbox() && payment.payment_method_id === "account_money";

  if (!isPix && !isSandboxBalance) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const purchaseId = payment.external_reference;
  if (!purchaseId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { user: true }
    });

    if (!purchase || purchase.provider !== "MERCADO_PAGO") {
      throw new Error("Compra Mercado Pago não encontrada.");
    }

    if (purchase.status === "PAID") return;

    if (purchase.currency !== MERCADO_PAGO_CURRENCY || payment.currency_id !== MERCADO_PAGO_CURRENCY) {
      throw new Error("Moeda do pagamento inválida.");
    }

    if (purchase.amount !== centsFromAmount(payment.transaction_amount)) {
      throw new Error("Valor do pagamento inválido.");
    }

    const existingPayment = await tx.purchase.findFirst({
      where: {
        mercadoPagoPaymentId: String(payment.id),
        NOT: { id: purchase.id }
      },
      select: { id: true }
    });

    if (existingPayment) {
      throw new Error("Pagamento Mercado Pago já associado a outra compra.");
    }

    await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        status: "PAID",
        mercadoPagoPaymentId: String(payment.id)
      }
    });

    if (purchase.kind === "CREDITS") {
      await tx.user.update({
        where: { id: purchase.userId },
        data: { downloadCredits: { increment: purchase.creditsGranted } }
      });
      return;
    }

    if (purchase.kind === "PREMIUM_30_DAYS") {
      const now = new Date();
      const currentEnd = purchase.user.subscriptionCurrentPeriodEnd;
      const base = currentEnd && currentEnd > now ? currentEnd : now;

      await tx.user.update({
        where: { id: purchase.userId },
        data: {
          subscriptionStatus: "ACTIVE",
          subscriptionCurrentPeriodEnd: addDays(base, purchase.premiumDaysGranted),
          downloadCredits: { increment: purchase.creditsGranted }
        }
      });
    }
  });

  return NextResponse.json({ received: true });
}
