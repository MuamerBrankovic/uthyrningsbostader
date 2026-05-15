-- AlterTable
ALTER TABLE "Bostad" ADD COLUMN     "bostadstyp" TEXT NOT NULL DEFAULT 'privat_rum';

-- CreateTable
CREATE TABLE "Hyresvardsanmalan" (
    "id" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "telefon" TEXT,
    "email" TEXT NOT NULL,
    "stad" TEXT,
    "adress" TEXT,
    "meddelande" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hyresvardsanmalan_pkey" PRIMARY KEY ("id")
);
