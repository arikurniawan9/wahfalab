import { z } from "zod";

/**
 * User schemas
 */
export const userSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional(),
  role: z.enum([
    "admin",
    "operator",
    "client",
    "field_officer",
    "analyst",
    "reporting",
    "finance",
  ]),
});

export const updateUserSchema = userSchema.partial();

/**
 * Category schemas
 */
export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional(),
  code: z.string().optional(),
});

export const updateCategorySchema = categorySchema.partial();

/**
 * Service schemas
 */
export const parameterSchema = z.object({
  name: z.string().min(1, "Nama parameter wajib diisi"),
  unit: z.string().optional(),
  method: z.string().optional(),
  limit: z.string().optional(),
  price: z.number().min(0, "Harga tidak boleh negatif").optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Nama layanan wajib diisi"),
  code: z.string().optional(),
  category: z.string().min(1, "Kategori wajib diisi"),
  description: z.string().optional(),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  parameters: z.array(parameterSchema).optional(),
  active: z.boolean().default(true),
});

export const updateServiceSchema = serviceSchema.partial();

/**
 * Equipment schemas
 */
export const equipmentSchema = z.object({
  name: z.string().min(1, "Nama alat wajib diisi"),
  code: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0, "Harga sewa tidak boleh negatif"),
  unit: z.string().default("hari"),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const updateEquipmentSchema = equipmentSchema.partial();

/**
 * Transport cost schemas
 */
export const transportCostSchema = z.object({
  name: z.string().min(1, "Nama transportasi wajib diisi"),
  vehicle_type: z.string().optional(),
  price_per_km: z.number().min(0, "Harga per km tidak boleh negatif"),
  base_price: z.number().min(0, "Harga dasar tidak boleh negatif"),
  description: z.string().optional(),
});

export const updateTransportCostSchema = transportCostSchema.partial();

/**
 * Engineer cost schemas
 */
export const engineerCostSchema = z.object({
  name: z.string().min(1, "Nama engineer wajib diisi"),
  role: z.string().optional(),
  price_per_day: z.number().min(0, "Harga per hari tidak boleh negatif"),
  description: z.string().optional(),
});

export const updateEngineerCostSchema = engineerCostSchema.partial();

/**
 * Operational catalog schemas
 */
export const operationalCatalogSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  type: z.enum(["transport", "engineer", "other"]),
  category: z.string().optional(),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  unit: z.string().optional(),
  description: z.string().optional(),
});

export const updateOperationalCatalogSchema = operationalCatalogSchema.partial();

/**
 * Quotation schemas
 */
export const quotationItemSchema = z.object({
  service_id: z.string().min(1, "Layanan wajib dipilih"),
  quantity: z.number().min(1, "Quantity minimal 1"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  discount: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export const quotationSchema = z.object({
  customer_id: z.string().min(1, "Customer wajib dipilih"),
  items: z.array(quotationItemSchema).min(1, "Minimal 1 item"),
  notes: z.string().optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  valid_until: z.string().optional(),
});

export const updateQuotationSchema = quotationSchema.partial();

/**
 * Job Order schemas
 */
export const jobOrderSchema = z.object({
  quotation_id: z.string().min(1, "Quotation wajib dipilih"),
  status: z
    .enum([
      "scheduled",
      "sampling",
      "analysis",
      "analysis_done",
      "reporting",
      "completed",
      "pending_payment",
      "paid",
    ])
    .optional(),
  notes: z.string().optional(),
  analyst_id: z.string().optional(),
  reporting_id: z.string().optional(),
});

export const updateJobOrderSchema = jobOrderSchema.partial();

/**
 * Sampling assignment schemas
 */
export const samplingAssignmentSchema = z.object({
  job_order_id: z.string().min(1, "Job order wajib dipilih"),
  field_officer_id: z.string().min(1, "Field officer wajib dipilih"),
  assistant_ids: z.array(z.string()).optional(),
  location: z.string().min(1, "Lokasi wajib diisi"),
  scheduled_date: z.string().min(1, "Tanggal wajib diisi"),
  notes: z.string().optional(),
});

export const updateSamplingAssignmentSchema = samplingAssignmentSchema.partial();

/**
 * Lab analysis schemas
 */
export const testResultSchema = z.object({
  parameter: z.string().min(1, "Parameter wajib diisi"),
  result: z.string().min(1, "Hasil wajib diisi"),
  unit: z.string().optional(),
  method: z.string().optional(),
  limit: z.string().optional(),
});

export const labAnalysisSchema = z.object({
  job_order_id: z.string().min(1, "Job order wajib dipilih"),
  analyst_id: z.string().min(1, "Analis wajib dipilih"),
  test_results: z.array(testResultSchema).optional(),
  analysis_notes: z.string().optional(),
  equipment_used: z.array(z.string()).optional(),
  sample_condition: z.string().optional(),
});

export const updateLabAnalysisSchema = labAnalysisSchema.partial();

/**
 * Company profile schemas
 */
export const companyProfileSchema = z.object({
  company_name: z.string().min(1, "Nama perusahaan wajib diisi"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional(),
  website: z.string().optional(),
  logo_url: z.string().optional(),
  npwp: z.string().optional(),
  nib: z.string().optional(),
  upload_storage_provider: z.string().optional(),
  upload_storage_public_path: z.string().optional(),
  upload_storage_external_url: z.string().optional(),
  upload_storage_note: z.string().optional(),
});

export const updateCompanyProfileSchema = companyProfileSchema.partial();

/**
 * Profile (user) schemas
 */
export const profileSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  company_address: z.string().optional(),
});

export const updateProfileSchema = profileSchema.partial();

/**
 * Export all schemas for easy import
 */
export const schemas = {
  user: userSchema,
  updateUser: updateUserSchema,
  category: categorySchema,
  updateCategory: updateCategorySchema,
  service: serviceSchema,
  updateService: updateServiceSchema,
  equipment: equipmentSchema,
  updateEquipment: updateEquipmentSchema,
  transportCost: transportCostSchema,
  updateTransportCost: updateTransportCostSchema,
  engineerCost: engineerCostSchema,
  updateEngineerCost: updateEngineerCostSchema,
  operationalCatalog: operationalCatalogSchema,
  updateOperationalCatalog: updateOperationalCatalogSchema,
  quotationItem: quotationItemSchema,
  quotation: quotationSchema,
  updateQuotation: updateQuotationSchema,
  jobOrder: jobOrderSchema,
  updateJobOrder: updateJobOrderSchema,
  samplingAssignment: samplingAssignmentSchema,
  updateSamplingAssignment: updateSamplingAssignmentSchema,
  testResult: testResultSchema,
  labAnalysis: labAnalysisSchema,
  updateLabAnalysis: updateLabAnalysisSchema,
  companyProfile: companyProfileSchema,
  updateCompanyProfile: updateCompanyProfileSchema,
  profile: profileSchema,
  updateProfile: updateProfileSchema,
};

/**
 * Type exports
 */
export type UserInput = z.infer<typeof userSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type EquipmentInput = z.infer<typeof equipmentSchema>;
export type TransportCostInput = z.infer<typeof transportCostSchema>;
export type EngineerCostInput = z.infer<typeof engineerCostSchema>;
export type OperationalCatalogInput = z.infer<typeof operationalCatalogSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type JobOrderInput = z.infer<typeof jobOrderSchema>;
export type SamplingAssignmentInput = z.infer<typeof samplingAssignmentSchema>;
export type LabAnalysisInput = z.infer<typeof labAnalysisSchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
