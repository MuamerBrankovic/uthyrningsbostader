-- CreateTable
CREATE TABLE "Offertforfragan" (
    "id" TEXT NOT NULL,
    "foretag" TEXT NOT NULL,
    "orgnr" TEXT,
    "kontaktperson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "stad" TEXT NOT NULL,
    "antal_personer" INTEGER,
    "inflyttning" TIMESTAMP(3),
    "bostadstyp" TEXT,
    "meddelande" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ny',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offertforfragan_pkey" PRIMARY KEY ("id")
);
