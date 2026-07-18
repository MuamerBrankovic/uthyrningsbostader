-- AlterTable
ALTER TABLE "Bokning" ADD COLUMN     "faktura_status" TEXT NOT NULL DEFAULT 'ej_fakturerad',
ADD COLUMN     "kontrakt_status" TEXT NOT NULL DEFAULT 'saknas',
ADD COLUMN     "kontrakt_uppdaterad" TIMESTAMP(3),
ADD COLUMN     "kontrakt_url" TEXT;
