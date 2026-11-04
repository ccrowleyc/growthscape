-- CreateTable
CREATE TABLE "CompanyKpi" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'NUMBER',
    "direction" TEXT NOT NULL DEFAULT 'HIGHER',
    "target" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "currentAsOf" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceDetail" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyKpi_companyId_code_key" ON "CompanyKpi"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "KpiSnapshot_kpiId_month_key" ON "KpiSnapshot"("kpiId", "month");

-- AddForeignKey
ALTER TABLE "CompanyKpi" ADD CONSTRAINT "CompanyKpi_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshot" ADD CONSTRAINT "KpiSnapshot_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "CompanyKpi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry existing data over: KPIs from each company's latest assessment,
-- plus any KPI already used in a valuation model, become company KPIs.
INSERT INTO "CompanyKpi" ("id","companyId","pillar","code","name","unit","direction","target","currentValue","currentAsOf","source","sourceDetail","sortOrder","updatedAt")
SELECT 'mig_' || ak."id", a."companyId", ak."pillar",
       LEFT(TRIM(BOTH '_' FROM UPPER(REGEXP_REPLACE(REPLACE(ak."name", '%', 'PCT'), '[^A-Za-z0-9]+', '_', 'g'))), 40),
       ak."name", ak."unit", ak."direction", ak."target", ak."actual", a."asOf", ak."source", ak."sourceDetail", ak."sortOrder", CURRENT_TIMESTAMP
FROM "AssessmentKpi" ak
JOIN "Assessment" a ON a."id" = ak."assessmentId"
WHERE a."id" IN (SELECT DISTINCT ON ("companyId") "id" FROM "Assessment" ORDER BY "companyId", "asOf" DESC, "createdAt" DESC)
ON CONFLICT ("companyId", "code") DO NOTHING;

INSERT INTO "CompanyKpi" ("id","companyId","pillar","code","name","unit","direction","updatedAt")
SELECT DISTINCT ON (vm."companyId", mk."code") 'mig_' || mk."id", vm."companyId",
       CASE
         WHEN mk."code" LIKE '%LARGEST%' OR mk."code" LIKE '%CONCENTRATION%' THEN 'Governance & Risk'
         WHEN mk."code" LIKE '%NRR%' OR mk."code" LIKE '%NPS%' OR mk."code" LIKE '%CUSTOMER%' OR mk."code" LIKE '%CHURN%' OR mk."code" LIKE '%RETENTION%' THEN 'Customer Success & Retention'
         WHEN mk."code" LIKE '%EBITDA%' OR mk."code" LIKE '%MARGIN%' OR mk."code" LIKE '%CASH%' THEN 'Financial Health'
         ELSE 'Revenue Growth'
       END,
       mk."code", mk."name", mk."unit",
       CASE WHEN mk."code" LIKE '%LARGEST%' OR mk."code" LIKE '%CHURN%' THEN 'LOWER' ELSE 'HIGHER' END,
       CURRENT_TIMESTAMP
FROM "ModelKpi" mk JOIN "ValuationModel" vm ON vm."id" = mk."modelId"
ON CONFLICT ("companyId", "code") DO NOTHING;

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_companyId_fkey";

-- DropForeignKey
ALTER TABLE "AssessmentKpi" DROP CONSTRAINT "AssessmentKpi_assessmentId_fkey";

-- DropTable
DROP TABLE "Assessment";

-- DropTable
DROP TABLE "AssessmentKpi";

