-- AlterTable
ALTER TABLE "Hyresvardsanmalan" ADD COLUMN     "intern_notering" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'obehandlad',
ADD COLUMN     "uppdaterad" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Offertforfragan" ADD COLUMN     "intern_notering" TEXT,
ADD COLUMN     "uppdaterad" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'obehandlad';
