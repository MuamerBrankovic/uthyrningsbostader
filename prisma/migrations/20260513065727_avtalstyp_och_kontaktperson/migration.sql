-- AlterTable
ALTER TABLE "Bokning" ADD COLUMN     "avtalstyp" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "Bostad" ADD COLUMN     "kontaktperson_bild" TEXT,
ADD COLUMN     "kontaktperson_email" TEXT,
ADD COLUMN     "kontaktperson_namn" TEXT,
ADD COLUMN     "kontaktperson_telefon" TEXT;
