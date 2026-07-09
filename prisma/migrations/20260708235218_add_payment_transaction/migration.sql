-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "membershipId" INTEGER,
    "mercadoPagoPaymentId" TEXT NOT NULL,
    "mercadoPagoPreferenceId" TEXT,
    "externalReference" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentType" TEXT,
    "status" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_mercadoPagoPaymentId_key" ON "PaymentTransaction"("mercadoPagoPaymentId");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
