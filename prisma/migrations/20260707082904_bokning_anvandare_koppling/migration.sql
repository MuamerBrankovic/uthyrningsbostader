-- AlterTable
ALTER TABLE "Bokning" ADD COLUMN     "anvandare_id" TEXT;

-- CreateIndex
CREATE INDEX "Bokning_anvandare_id_idx" ON "Bokning"("anvandare_id");

-- AddForeignKey
ALTER TABLE "Bokning" ADD CONSTRAINT "Bokning_anvandare_id_fkey" FOREIGN KEY ("anvandare_id") REFERENCES "Anvandare"("id") ON DELETE SET NULL ON UPDATE CASCADE;
