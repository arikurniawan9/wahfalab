-- DropForeignKey
ALTER TABLE "quotation_items" DROP CONSTRAINT "quotation_items_service_id_fkey";

-- AlterTable
ALTER TABLE "quotation_items" ADD COLUMN     "equipment_id" TEXT,
ALTER COLUMN "service_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
