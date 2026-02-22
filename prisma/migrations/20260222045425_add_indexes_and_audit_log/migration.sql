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
