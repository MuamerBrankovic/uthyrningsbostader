/*
  Warnings:
  - You are about to drop the column `status` on the `Rum` table. All the data in the column will be lost.
    (Fältet är oanvänt — tillgänglighet beräknas från bokningar, inget läser Rum.status.)
*/
-- AlterTable
ALTER TABLE "Rum" DROP COLUMN "status";

-- CreateIndex
CREATE INDEX "Rum_bostad_id_idx" ON "Rum"("bostad_id");

-- CreateIndex
CREATE INDEX "Bokning_rum_id_status_idx" ON "Bokning"("rum_id", "status");

-- CreateIndex
CREATE INDEX "Bokning_created_at_idx" ON "Bokning"("created_at");

-- CreateIndex
CREATE INDEX "Offertforfragan_created_at_idx" ON "Offertforfragan"("created_at");

-- CreateIndex
CREATE INDEX "Hyresvardsanmalan_created_at_idx" ON "Hyresvardsanmalan"("created_at");
