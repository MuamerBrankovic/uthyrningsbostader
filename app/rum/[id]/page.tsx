import { cache } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RumSida from "./RumSida";

type Props = { params: Promise<{ id: string }> };

const getRum = cache(async (id: string) => {
  return prisma.rum.findUnique({
    where: { id },
    include: {
      bostad: { select: { id: true, namn: true, adress: true, stadsdel: true } },
      bokningar: {
        where: { status: "bekraftad" },
        select: { id: true, startdatum: true, slutdatum: true, status: true },
      },
    },
  });
});

function bokningAvailability(
  bokningar: { slutdatum: Date | null; status: string }[]
): string {
  const active = bokningar.filter((b) => {
    if (!b.slutdatum) return true;
    return b.slutdatum > new Date();
  });
  if (active.length === 0) return "https://schema.org/InStock";
  if (active.some((b) => !b.slutdatum)) return "https://schema.org/SoldOut";
  return "https://schema.org/PreOrder";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rum = await getRum(id);
  if (!rum) return { title: "Rum hittades inte — ReLoka" };

  const plats = rum.bostad.adress ?? rum.bostad.stadsdel ?? rum.bostad.namn;
  return {
    title: `Möblerat rum i ${plats} — ReLoka`,
    description:
      rum.beskrivning ??
      `${rum.namn} — ${rum.manadshyra.toLocaleString("sv-SE")} kr/mån. Ledigt möblerat rum hos ${rum.bostad.namn}.`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const rum = await getRum(id);

  const jsonLd = rum
    ? {
        "@context": "https://schema.org",
        "@type": "Accommodation",
        name: rum.namn,
        description:
          rum.beskrivning ??
          `Möblerat rum hos ${rum.bostad.namn}`,
        ...(rum.bostad.adress || rum.bostad.stadsdel
          ? {
              address: {
                "@type": "PostalAddress",
                streetAddress: rum.bostad.adress ?? undefined,
                addressLocality: rum.bostad.stadsdel ?? undefined,
                addressCountry: "SE",
              },
            }
          : {}),
        ...(rum.kvm
          ? {
              floorSize: {
                "@type": "QuantitativeValue",
                value: rum.kvm,
                unitCode: "MTK",
              },
            }
          : {}),
        numberOfRooms: 1,
        offers: {
          "@type": "Offer",
          price: rum.manadshyra,
          priceCurrency: "SEK",
          availability: bokningAvailability(rum.bokningar),
        },
        provider: {
          "@type": "Organization",
          name: "ReLoka AB",
          brand: "ReLoka",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RumSida rumId={id} />
    </>
  );
}
