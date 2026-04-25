-- AlterTable
ALTER TABLE "company_profiles"
ADD COLUMN     "upload_storage_provider" TEXT NOT NULL DEFAULT 'supabase',
ADD COLUMN     "upload_storage_public_path" TEXT,
ADD COLUMN     "upload_storage_external_url" TEXT,
ADD COLUMN     "upload_storage_note" TEXT;
