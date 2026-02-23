-- AlterEnum
-- Add missing JobStatus values: analysis, reporting
ALTER TYPE "JobStatus" ADD VALUE 'analysis';
ALTER TYPE "JobStatus" ADD VALUE 'reporting';
