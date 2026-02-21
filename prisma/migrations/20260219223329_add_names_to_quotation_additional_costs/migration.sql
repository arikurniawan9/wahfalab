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
