-- AlterTable
ALTER TABLE "news" ADD COLUMN     "show_tags" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
