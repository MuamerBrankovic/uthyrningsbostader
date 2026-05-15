import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Home for Us — Företagsbostäder i Linköping och Norrköping",
    template: "%s | Home for Us",
  },
  description:
    "Home for Us hjälper HR-chefer och konsultansvariga att snabbt hitta möblerade bostäder i Linköping och Norrköping. Flexibla avtal, fullt möblerat, ingen mäklare.",
  openGraph: {
    title: "Home for Us — Företagsbostäder i Linköping och Norrköping",
    description:
      "Möblerade bostäder för konsulter och tjänsteresenärer. Flexibla avtal utan krångel.",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Home for Us — Företagsbostäder i Linköping och Norrköping",
    description:
      "Möblerade bostäder för konsulter och tjänsteresenärer. Flexibla avtal utan krångel.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
