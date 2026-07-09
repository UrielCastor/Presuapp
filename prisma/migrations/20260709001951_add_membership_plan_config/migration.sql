-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'VIP',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanChangeLog" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "adminName" TEXT NOT NULL,
    "fieldChanged" TEXT NOT NULL,
    "previousValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanChangeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanChangeLog" ADD CONSTRAINT "PlanChangeLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
