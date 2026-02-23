-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'analysis_done';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'analyst';
ALTER TYPE "UserRole" ADD VALUE 'reporting';

-- AlterTable
ALTER TABLE "job_orders" ADD COLUMN     "analysis_done_at" TIMESTAMP(3),
ADD COLUMN     "analysis_started_at" TIMESTAMP(3),
ADD COLUMN     "analyst_id" TEXT,
ADD COLUMN     "reporting_done_at" TIMESTAMP(3),
ADD COLUMN     "reporting_id" TEXT;

-- CreateTable
CREATE TABLE "lab_analyses" (
    "id" TEXT NOT NULL,
    "job_order_id" TEXT NOT NULL,
    "analyst_id" TEXT NOT NULL,
    "test_results" JSONB,
    "analysis_notes" TEXT,
    "equipment_used" JSONB,
    "sample_condition" TEXT,
    "result_pdf_url" TEXT,
    "raw_data_url" TEXT,
    "analysis_started_at" TIMESTAMP(3),
    "analysis_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_analyses_job_order_id_key" ON "lab_analyses"("job_order_id");

-- CreateIndex
CREATE INDEX "lab_analyses_job_order_id_idx" ON "lab_analyses"("job_order_id");

-- CreateIndex
CREATE INDEX "lab_analyses_analyst_id_idx" ON "lab_analyses"("analyst_id");

-- CreateIndex
CREATE INDEX "job_orders_analyst_id_idx" ON "job_orders"("analyst_id");

-- CreateIndex
CREATE INDEX "job_orders_reporting_id_idx" ON "job_orders"("reporting_id");

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_analyst_id_fkey" FOREIGN KEY ("analyst_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_reporting_id_fkey" FOREIGN KEY ("reporting_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_analyses" ADD CONSTRAINT "lab_analyses_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_analyses" ADD CONSTRAINT "lab_analyses_analyst_id_fkey" FOREIGN KEY ("analyst_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
