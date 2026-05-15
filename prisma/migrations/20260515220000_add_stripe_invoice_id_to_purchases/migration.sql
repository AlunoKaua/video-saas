ALTER TABLE "Purchase" ADD COLUMN "stripeInvoiceId" TEXT;

CREATE UNIQUE INDEX "Purchase_stripeInvoiceId_key" ON "Purchase"("stripeInvoiceId");
