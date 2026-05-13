-- CreateTable
CREATE TABLE "Bostad" (
    "id" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "adress" TEXT,
    "stadsdel" TEXT,
    "beskrivning" TEXT,
    "bilder" TEXT[],
    "delade_utrymmen" TEXT[],
    "inkluderat" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bostad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rum" (
    "id" TEXT NOT NULL,
    "bostad_id" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "beskrivning" TEXT,
    "bilder" TEXT[],
    "kvm" INTEGER,
    "manadshyra" INTEGER NOT NULL,
    "moblering" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ledig',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bokning" (
    "id" TEXT NOT NULL,
    "rum_id" TEXT NOT NULL,
    "kund_foretag" TEXT,
    "kund_orgnr" TEXT,
    "kund_kontaktperson" TEXT NOT NULL,
    "boende_namn" TEXT,
    "email" TEXT NOT NULL,
    "telefon" TEXT,
    "startdatum" TIMESTAMP(3) NOT NULL,
    "slutdatum" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'forfragan',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bokning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anvandare" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "losenord" TEXT NOT NULL,
    "namn" TEXT NOT NULL,
    "roll" TEXT NOT NULL DEFAULT 'hyresgast',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anvandare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Anvandare_email_key" ON "Anvandare"("email");

-- AddForeignKey
ALTER TABLE "Rum" ADD CONSTRAINT "Rum_bostad_id_fkey" FOREIGN KEY ("bostad_id") REFERENCES "Bostad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bokning" ADD CONSTRAINT "Bokning_rum_id_fkey" FOREIGN KEY ("rum_id") REFERENCES "Rum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
