-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MERCADO_PAGO');

-- CreateEnum
CREATE TYPE "PurchaseKind" AS ENUM ('CREDITS', 'PREMIUM_30_DAYS');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN "kind" "PurchaseKind" NOT NULL DEFAULT 'CREDITS',
ADD COLUMN "mercadoPagoPreferenceId" TEXT,
ADD COLUMN "mercadoPagoPaymentId" TEXT,
ADD COLUMN "premiumDaysGranted" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "stripeSessionId" DROP NOT NULL,
ALTER COLUMN "creditsGranted" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_mercadoPagoPreferenceId_key" ON "Purchase"("mercadoPagoPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_mercadoPagoPaymentId_key" ON "Purchase"("mercadoPagoPaymentId");

-- CreateIndex
CREATE INDEX "Purchase_provider_status_idx" ON "Purchase"("provider", "status");
