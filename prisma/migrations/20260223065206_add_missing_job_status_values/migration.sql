-- AlterEnum
-- Add missing JobStatus values: analysis_ready (analysis already exists)
-- Note: analysis_ready must be added after sampling in the enum order
ALTER TYPE "JobStatus" ADD VALUE 'analysis_ready';
