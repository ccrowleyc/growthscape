-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationModel" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelKpi" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'PRIMARY',
    "unit" TEXT NOT NULL DEFAULT 'NUMBER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ModelKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valuation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'CURRENT',
    "asOf" TIMESTAMP(3) NOT NULL,
    "inputs" TEXT NOT NULL,
    "savedValue" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Valuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicInitiative" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "startQuarter" TEXT NOT NULL,
    "endQuarter" TEXT NOT NULL,
    "kpiCodes" TEXT NOT NULL DEFAULT '[]',
    "budget" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicInitiative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeAdjustment" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "quarter" TEXT NOT NULL,
    "kpiCode" TEXT NOT NULL,
    "planned" DOUBLE PRECISION,
    "actual" DOUBLE PRECISION,

    CONSTRAINT "InitiativeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValueCreationPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baselineValuationId" TEXT NOT NULL,
    "targetValuationId" TEXT NOT NULL,
    "marginPct" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValueCreationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanInitiative" (
    "planId" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,

    CONSTRAINT "PlanInitiative_pkey" PRIMARY KEY ("planId","initiativeId")
);

-- CreateTable
CREATE TABLE "PlanAdjustment" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kpiCode" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlanAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentKpi" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'NUMBER',
    "direction" TEXT NOT NULL DEFAULT 'HIGHER',
    "target" DOUBLE PRECISION,
    "actual" DOUBLE PRECISION,
    "prior" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceDetail" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssessmentKpi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_companyId_key" ON "Membership"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ValuationModel_companyId_name_key" ON "ValuationModel"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ModelKpi_modelId_code_key" ON "ModelKpi"("modelId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Valuation_companyId_name_key" ON "Valuation"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicInitiative_companyId_name_key" ON "StrategicInitiative"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InitiativeAdjustment_initiativeId_quarter_kpiCode_key" ON "InitiativeAdjustment"("initiativeId", "quarter", "kpiCode");

-- CreateIndex
CREATE UNIQUE INDEX "ValueCreationPlan_companyId_name_key" ON "ValueCreationPlan"("companyId", "name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationModel" ADD CONSTRAINT "ValuationModel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelKpi" ADD CONSTRAINT "ModelKpi_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ValuationModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valuation" ADD CONSTRAINT "Valuation_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "ValuationModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicInitiative" ADD CONSTRAINT "StrategicInitiative_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicInitiative" ADD CONSTRAINT "StrategicInitiative_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeAdjustment" ADD CONSTRAINT "InitiativeAdjustment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "StrategicInitiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueCreationPlan" ADD CONSTRAINT "ValueCreationPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueCreationPlan" ADD CONSTRAINT "ValueCreationPlan_baselineValuationId_fkey" FOREIGN KEY ("baselineValuationId") REFERENCES "Valuation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValueCreationPlan" ADD CONSTRAINT "ValueCreationPlan_targetValuationId_fkey" FOREIGN KEY ("targetValuationId") REFERENCES "Valuation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInitiative" ADD CONSTRAINT "PlanInitiative_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ValueCreationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInitiative" ADD CONSTRAINT "PlanInitiative_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "StrategicInitiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanAdjustment" ADD CONSTRAINT "PlanAdjustment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ValueCreationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentKpi" ADD CONSTRAINT "AssessmentKpi_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
