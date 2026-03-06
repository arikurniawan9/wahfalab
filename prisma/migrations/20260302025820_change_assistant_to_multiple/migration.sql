/*
  Warnings:

  - A unique constraint covering the columns `[invoice_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('sampling_completed', 'analysis_ready', 'analysis_completed', 'reporting_completed', 'invoice_generated', 'invoice_sent', 'payment_received', 'job_assigned', 'approval_requested', 'approval_decided');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('lab_service', 'operational', 'salary', 'office_supply', 'maintenance', 'other');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bank_account_id" TEXT,
ADD COLUMN     "handled_by" TEXT,
ADD COLUMN     "invoice_id" TEXT,
ADD COLUMN     "payment_proof_url" TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "regulation_id" TEXT;

-- CreateTable
CREATE TABLE "financial_records" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL DEFAULT 'other',
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "reference_id" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_holder" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_handovers" (
    "id" TEXT NOT NULL,
    "job_order_id" TEXT NOT NULL,
    "handover_number" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "sample_condition" TEXT NOT NULL,
    "sample_qty" INTEGER NOT NULL,
    "sample_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_assistants" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_assistants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "parameters_list" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulation_parameters" (
    "id" TEXT NOT NULL,
    "regulation_id" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "method" TEXT,
    "unit" TEXT,
    "limit_min" TEXT,
    "limit_max" TEXT,
    "limit_value" TEXT,
    "requirements" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regulation_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "job_order_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SamplingAssistants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "financial_records_type_idx" ON "financial_records"("type");

-- CreateIndex
CREATE INDEX "financial_records_category_idx" ON "financial_records"("category");

-- CreateIndex
CREATE INDEX "financial_records_transaction_date_idx" ON "financial_records"("transaction_date");

-- CreateIndex
CREATE INDEX "financial_records_bank_account_id_idx" ON "financial_records"("bank_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_account_number_key" ON "bank_accounts"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "sample_handovers_job_order_id_key" ON "sample_handovers"("job_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_handovers_handover_number_key" ON "sample_handovers"("handover_number");

-- CreateIndex
CREATE INDEX "sample_handovers_job_order_id_idx" ON "sample_handovers"("job_order_id");

-- CreateIndex
CREATE INDEX "sample_handovers_sender_id_idx" ON "sample_handovers"("sender_id");

-- CreateIndex
CREATE INDEX "sample_handovers_receiver_id_idx" ON "sample_handovers"("receiver_id");

-- CreateIndex
CREATE UNIQUE INDEX "regulations_name_key" ON "regulations"("name");

-- CreateIndex
CREATE INDEX "regulations_name_idx" ON "regulations"("name");

-- CreateIndex
CREATE INDEX "regulations_status_idx" ON "regulations"("status");

-- CreateIndex
CREATE INDEX "regulation_parameters_regulation_id_idx" ON "regulation_parameters"("regulation_id");

-- CreateIndex
CREATE INDEX "regulation_parameters_parameter_name_idx" ON "regulation_parameters"("parameter_name");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_job_order_id_key" ON "invoices"("job_order_id");

-- CreateIndex
CREATE INDEX "invoices_job_order_id_idx" ON "invoices"("job_order_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "_SamplingAssistants_AB_unique" ON "_SamplingAssistants"("A", "B");

-- CreateIndex
CREATE INDEX "_SamplingAssistants_B_index" ON "_SamplingAssistants"("B");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_id_key" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_handled_by_idx" ON "payments"("handled_by");

-- CreateIndex
CREATE INDEX "payments_bank_account_id_idx" ON "payments"("bank_account_id");

-- CreateIndex
CREATE INDEX "services_regulation_id_idx" ON "services"("regulation_id");

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_handovers" ADD CONSTRAINT "sample_handovers_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_handovers" ADD CONSTRAINT "sample_handovers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_handovers" ADD CONSTRAINT "sample_handovers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulation_parameters" ADD CONSTRAINT "regulation_parameters_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "regulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_handled_by_fkey" FOREIGN KEY ("handled_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SamplingAssistants" ADD CONSTRAINT "_SamplingAssistants_A_fkey" FOREIGN KEY ("A") REFERENCES "field_assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SamplingAssistants" ADD CONSTRAINT "_SamplingAssistants_B_fkey" FOREIGN KEY ("B") REFERENCES "sampling_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
