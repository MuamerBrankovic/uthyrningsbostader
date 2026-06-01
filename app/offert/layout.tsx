import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Begär offert",
  description:
    "Begär offert för företagsbostäder i Linköping och Norrköping. Vi återkommer normalt inom 3 timmar på vardagar med ett skräddarsytt förslag.",
};

export default function OffertLayout({ children }: { children: React.ReactNode }) {
  return children;
}
