/*
  Warnings:

  - You are about to drop the column `created_at` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `is_mandatory` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `limit_max` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `limit_min` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `limit_value` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `parameter_name` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `requirements` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `regulation_parameters` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `regulations` table. All the data in the column will be lost.
  - You are about to drop the column `parameters_list` on the `regulations` table. All the data in the column will be lost.
  - Added the required column `parameter` to the `regulation_parameters` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "regulation_parameters_parameter_name_idx";

-- DropIndex
DROP INDEX "regulations_status_idx";

-- AlterTable
ALTER TABLE "regulation_parameters" DROP COLUMN "created_at",
DROP COLUMN "is_mandatory",
DROP COLUMN "limit_max",
DROP COLUMN "limit_min",
DROP COLUMN "limit_value",
DROP COLUMN "notes",
DROP COLUMN "parameter_name",
DROP COLUMN "requirements",
DROP COLUMN "updated_at",
ADD COLUMN     "parameter" TEXT NOT NULL,
ADD COLUMN     "standard_value" TEXT;

-- AlterTable
ALTER TABLE "regulations" DROP COLUMN "code",
DROP COLUMN "parameters_list",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "description" TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" TEXT NOT NULL,
    "report_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sampling_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "analysis_date" TIMESTAMP(3),
    "client_name" TEXT,
    "company_name" TEXT,
    "address" TEXT,
    "sample_type" TEXT,
    "sample_origin" TEXT,
    "sample_code" TEXT,
    "regulation_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by" TEXT,
    "job_order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_report_items" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "unit" TEXT,
    "standard_value" TEXT,
    "result_value" TEXT NOT NULL,
    "method" TEXT,
    "is_qualified" BOOLEAN,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "lab_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lab_reports_report_number_key" ON "lab_reports"("report_number");

-- CreateIndex
CREATE UNIQUE INDEX "lab_reports_job_order_id_key" ON "lab_reports"("job_order_id");

-- CreateIndex
CREATE INDEX "lab_reports_regulation_id_idx" ON "lab_reports"("regulation_id");

-- CreateIndex
CREATE INDEX "lab_reports_report_number_idx" ON "lab_reports"("report_number");

-- CreateIndex
CREATE INDEX "lab_report_items_report_id_idx" ON "lab_report_items"("report_id");

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_report_items" ADD CONSTRAINT "lab_report_items_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "lab_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
