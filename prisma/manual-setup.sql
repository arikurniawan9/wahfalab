-- ===============================================
-- Migration: 20260219223329_add_names_to_quotation_additional_costs
-- ===============================================
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'operator', 'client', 'field_officer');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('scheduled', 'sampling', 'analysis', 'reporting', 'completed');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'paid');

-- CreateEnum
CREATE TYPE "SamplingStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "OperationalCategory" AS ENUM ('perdiem', 'transport');

-- CreateTable
CREATE TABLE "operational_catalog" (
    "id" TEXT NOT NULL,
    "category" "OperationalCategory" NOT NULL,
    "perdiem_type" TEXT,
    "location" TEXT,
    "distance_category" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_history" (
    "id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_price" DECIMAL,
    "new_price" DECIMAL,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operational_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "full_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'client',
    "company_name" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "category" TEXT,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "parameters" JSONB,
    "regulation" TEXT,
    "unit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "quotation_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL NOT NULL DEFAULT 0,
    "use_tax" BOOLEAN NOT NULL DEFAULT true,
    "tax_amount" DECIMAL NOT NULL DEFAULT 0,
    "perdiem_name" TEXT,
    "perdiem_price" DECIMAL NOT NULL DEFAULT 0,
    "perdiem_qty" INTEGER NOT NULL DEFAULT 0,
    "transport_name" TEXT,
    "transport_price" DECIMAL NOT NULL DEFAULT 0,
    "transport_qty" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL NOT NULL DEFAULT 0,
    "status" "QuotationStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "price_snapshot" DECIMAL NOT NULL,
    "parameter_snapshot" TEXT,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_orders" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "tracking_code" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "certificate_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sampling_assignments" (
    "id" TEXT NOT NULL,
    "job_order_id" TEXT NOT NULL,
    "field_officer_id" TEXT NOT NULL,
    "status" "SamplingStatus" NOT NULL DEFAULT 'pending',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "photos" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sampling_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_orders" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "departure_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "transportation_type" TEXT,
    "accommodation_type" TEXT,
    "daily_allowance" DECIMAL(10,2),
    "total_budget" DECIMAL(10,2),
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travel_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL DEFAULT 'WahfaLab',
    "address" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "tagline" TEXT,
    "npwp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "specification" TEXT,
    "price" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "availability_status" TEXT NOT NULL DEFAULT 'available',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_name_key" ON "service_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- CreateIndex
CREATE UNIQUE INDEX "job_orders_tracking_code_key" ON "job_orders"("tracking_code");

-- CreateIndex
CREATE UNIQUE INDEX "sampling_assignments_job_order_id_key" ON "sampling_assignments"("job_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "travel_orders_assignment_id_key" ON "travel_orders"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "travel_orders_document_number_key" ON "travel_orders"("document_number");

-- AddForeignKey
ALTER TABLE "operational_history" ADD CONSTRAINT "operational_history_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "operational_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sampling_assignments" ADD CONSTRAINT "sampling_assignments_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sampling_assignments" ADD CONSTRAINT "sampling_assignments_field_officer_id_fkey" FOREIGN KEY ("field_officer_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_orders" ADD CONSTRAINT "travel_orders_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "sampling_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ===============================================
-- Migration: 20260220021857_add_equipment_to_items
-- ===============================================
-- DropForeignKey
ALTER TABLE "quotation_items" DROP CONSTRAINT "quotation_items_service_id_fkey";

-- AlterTable
ALTER TABLE "quotation_items" ADD COLUMN     "equipment_id" TEXT,
ALTER COLUMN "service_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ===============================================
-- Migration: 20260221010549_add_approval_requests
-- ===============================================
-- CreateEnum
CREATE TYPE "ApprovalRequestType" AS ENUM ('edit', 'delete');

-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "request_type" "ApprovalRequestType" NOT NULL,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'pending',
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_requests_entity_type_entity_id_idx" ON "approval_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "approval_requests_requester_id_idx" ON "approval_requests"("requester_id");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "approval_requests"("status");

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ===============================================
-- Migration: 20260222045425_add_indexes_and_audit_log
-- ===============================================
-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "user_id" TEXT,
    "user_email" TEXT,
    "user_role" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "approval_requests_created_at_idx" ON "approval_requests"("created_at");

-- CreateIndex
CREATE INDEX "equipment_name_idx" ON "equipment"("name");

-- CreateIndex
CREATE INDEX "equipment_category_idx" ON "equipment"("category");

-- CreateIndex
CREATE INDEX "equipment_availability_status_idx" ON "equipment"("availability_status");

-- CreateIndex
CREATE INDEX "job_orders_quotation_id_idx" ON "job_orders"("quotation_id");

-- CreateIndex
CREATE INDEX "job_orders_status_idx" ON "job_orders"("status");

-- CreateIndex
CREATE INDEX "job_orders_tracking_code_idx" ON "job_orders"("tracking_code");

-- CreateIndex
CREATE INDEX "job_orders_created_at_idx" ON "job_orders"("created_at");

-- CreateIndex
CREATE INDEX "profiles_email_idx" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_role_idx" ON "profiles"("role");

-- CreateIndex
CREATE INDEX "profiles_created_at_idx" ON "profiles"("created_at");

-- CreateIndex
CREATE INDEX "quotations_user_id_idx" ON "quotations"("user_id");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_created_at_idx" ON "quotations"("created_at");

-- CreateIndex
CREATE INDEX "quotations_quotation_number_idx" ON "quotations"("quotation_number");

-- CreateIndex
CREATE INDEX "sampling_assignments_field_officer_id_idx" ON "sampling_assignments"("field_officer_id");

-- CreateIndex
CREATE INDEX "sampling_assignments_status_idx" ON "sampling_assignments"("status");

-- CreateIndex
CREATE INDEX "sampling_assignments_job_order_id_idx" ON "sampling_assignments"("job_order_id");

-- CreateIndex
CREATE INDEX "sampling_assignments_scheduled_date_idx" ON "sampling_assignments"("scheduled_date");

-- CreateIndex
CREATE INDEX "services_category_id_idx" ON "services"("category_id");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_created_at_idx" ON "services"("created_at");

-- CreateIndex
CREATE INDEX "travel_orders_assignment_id_idx" ON "travel_orders"("assignment_id");

-- CreateIndex
CREATE INDEX "travel_orders_document_number_idx" ON "travel_orders"("document_number");

-- CreateIndex
CREATE INDEX "travel_orders_created_at_idx" ON "travel_orders"("created_at");


-- ===============================================
-- Migration: 20260222091307_add_payment_system
-- ===============================================
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'cancelled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'pending_payment';
ALTER TYPE "JobStatus" ADD VALUE 'paid';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "job_order_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod",
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "transfer_reference" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_job_order_id_key" ON "payments"("job_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_number_key" ON "payments"("invoice_number");

-- CreateIndex
CREATE INDEX "payments_job_order_id_idx" ON "payments"("job_order_id");

-- CreateIndex
CREATE INDEX "payments_invoice_number_idx" ON "payments"("invoice_number");

-- CreateIndex
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ===============================================
-- Migration: 20260222093039_add_finance_role
-- ===============================================
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'finance';


-- ===============================================
-- Migration: 20260222152027_add_phone_to_profile
-- ===============================================
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "phone" TEXT;


-- ===============================================
-- Migration: 20260223065205_add_analyst_reporting_roles
-- ===============================================
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


-- ===============================================
-- Migration: 20260223065206_add_missing_job_status_values
-- ===============================================
-- AlterEnum
-- Add missing JobStatus values: analysis_ready (analysis already exists)
-- Note: analysis_ready must be added after sampling in the enum order
ALTER TYPE "JobStatus" ADD VALUE 'analysis_ready';


-- ===============================================
-- Migration: 20260302025820_change_assistant_to_multiple
-- ===============================================
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


-- ===============================================
-- Migration: 20260305072607_add_landing_page_config_and_role
-- ===============================================
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'content_manager';

-- CreateTable
CREATE TABLE "landing_page_configs" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "hero_title" TEXT NOT NULL DEFAULT 'Solusi Terpercaya untuk Analisis Kimia & Lingkungan',
    "hero_description" TEXT NOT NULL DEFAULT 'WahfaLab menyediakan layanan laboratorium profesional dengan akurasi tinggi dan hasil yang cepat. Mendukung kebutuhan industri Anda dengan standar internasional.',
    "hero_image_url" TEXT,
    "hero_cta_text" TEXT NOT NULL DEFAULT 'Mulai Penawaran',
    "hero_cta_link" TEXT NOT NULL DEFAULT '/login',
    "features" JSONB DEFAULT '[{"icon": "ShieldCheck", "title": "Terakreditasi", "description": "Metode pengujian kami sesuai dengan standar regulasi nasional dan internasional (ISO/IEC 17025)."}, {"icon": "Clock", "title": "Hasil Cepat", "description": "Kami memahami urgensi bisnis Anda. Proses analisis dilakukan secara efisien tanpa mengurangi akurasi."}, {"icon": "Beaker", "title": "Layanan Lengkap", "description": "Mulai dari pengujian air, udara, tanah, hingga kalibrasi alat industri di satu tempat."}]',
    "portfolio" JSONB DEFAULT '[]',
    "legal_content" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_configs_pkey" PRIMARY KEY ("id")
);


-- ===============================================
-- Migration: 20260305082558_add_banners_to_landing_page
-- ===============================================
-- AlterTable
ALTER TABLE "landing_page_configs" ADD COLUMN     "banners" JSONB DEFAULT '[]';


-- ===============================================
-- Migration: 20260305151738_add_portfolio_details_to_config
-- ===============================================
-- AlterTable
ALTER TABLE "landing_page_configs" ADD COLUMN     "portfolio_description" TEXT NOT NULL DEFAULT 'Telah dipercaya oleh berbagai perusahaan terkemuka di Indonesia untuk memastikan standar kualitas dan kepatuhan lingkungan.',
ADD COLUMN     "portfolio_title" TEXT NOT NULL DEFAULT 'Mitra Industri Kami';


-- ===============================================
-- Migration: 20260305153347_add_gallery_to_config
-- ===============================================
-- AlterTable
ALTER TABLE "landing_page_configs" ADD COLUMN     "gallery" JSONB DEFAULT '[]';


-- ===============================================
-- Migration: 20260305161809_add_commitment_to_config
-- ===============================================
-- AlterTable
ALTER TABLE "landing_page_configs" ADD COLUMN     "commitment_content" TEXT NOT NULL DEFAULT 'Integritas, inovasi, dan kualitas menjadi pondasi dalam setiap layanan yang kami tawarkan. Kami berusaha untuk memberikan solusi yang paling efektif, efisien, dan sesuai dengan perkembangan terbaru dalam ilmu lingkungan juga membantu mewujudkan masa depan yang lebih hijau, bersih, dan berkelanjutan.',
ADD COLUMN     "commitment_title" TEXT NOT NULL DEFAULT 'Komitmen Kami';


-- ===============================================
-- Migration: 20260305162736_add_news_and_contact_message
-- ===============================================
-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Umum',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_slug_idx" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_created_at_idx" ON "news"("created_at");

-- CreateIndex
CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");


-- ===============================================
-- Migration: 20260306022349_add_tags_to_news
-- ===============================================
-- AlterTable
ALTER TABLE "news" ADD COLUMN     "show_tags" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];


-- ===============================================
-- Migration: 20260306025620_add_navbar_menus_to_config
-- ===============================================
-- AlterTable
ALTER TABLE "landing_page_configs" ADD COLUMN     "navbar_menus" JSONB DEFAULT '[]';


-- ===============================================
-- Migration: 20260306203411_add_system_notification_type
-- ===============================================
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'system';


-- ===============================================
-- Migration: 20260306210554_add_permissions_to_profile
-- ===============================================
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "permissions" JSONB DEFAULT '{}';


-- ===============================================
-- Migration: 20260307160153_add_leader_fields_to_company_profile
-- ===============================================
-- AlterTable
ALTER TABLE "company_profiles" ADD COLUMN     "leader_name" TEXT,
ADD COLUMN     "signature_url" TEXT,
ADD COLUMN     "stamp_url" TEXT;


-- ===============================================
-- Migration: 20260307165745_add_signed_travel_order_url
-- ===============================================
-- AlterTable
ALTER TABLE "sampling_assignments" ADD COLUMN     "signed_travel_order_url" TEXT;


-- ===============================================
-- Migration: 20260310162006_add_title_to_quotation
-- ===============================================
-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "title" TEXT;


-- ===============================================
-- Migration: 20260310164526_finalize_reporting_system
-- ===============================================
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


-- ===============================================
-- Migration: 20260411180429_add_password_to_profile
-- ===============================================
-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "password" TEXT;


-- ===============================================
-- Migration: 20260422101500_add_customer_address_and_sampling_location
-- ===============================================
ALTER TABLE "quotations"
ADD COLUMN IF NOT EXISTS "sampling_location" TEXT;


-- ===============================================
-- Migration: 20260425183000_add_upload_storage_settings_to_company_profile
-- ===============================================
-- AlterTable
ALTER TABLE "company_profiles"
ADD COLUMN     "upload_storage_provider" TEXT NOT NULL DEFAULT 'supabase',
ADD COLUMN     "upload_storage_public_path" TEXT,
ADD COLUMN     "upload_storage_external_url" TEXT,
ADD COLUMN     "upload_storage_note" TEXT;


