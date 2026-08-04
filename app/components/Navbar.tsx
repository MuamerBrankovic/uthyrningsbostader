"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import OffertModal from "@/app/components/OffertModal";
import { useSession } from "@/app/components/SessionProvider";
import { useAktivSektion } from "@/app/components/useAktivSektion";

// ─── Menyn ───────────────────────────────────────────────────────────────────
//
// ALL MENYKONFIGURATION BOR HÄR. Ordningen i listan är ordningen i menyn.
// Det finns två sorters länkar:
//
//   1. SIDLÄNK — pekar på en egen adress. Använd "matcha":
//        { href: "/priser", label: "Priser", matcha: ["/priser"] }
//      Lägg till fler adresser i "matcha" om undersidor ska markera samma
//      länk. "Bostäder" nedan markeras t.ex. även på /bostad/[id] och
//      /rum/[id] eftersom de adresserna står med i listan.
//
//   2. SEKTIONSLÄNK — hoppar till en del av startsidan. Använd "sektion":
//        { href: "/#kontakt", label: "Kontakt", sektion: "kontakt" }
//      Texten i "sektion" måste vara exakt samma som id:t på taggen i
//      app/page.tsx, alltså <section id="kontakt">. Markeringen tänds och
//      släcks sedan automatiskt när man scrollar — inget mer behöver göras.

type MenyPost = {
  href: string;
  label: string;
  matcha?: string[]; // sidlänk: adresser som markerar länken
  sektion?: string; // sektionslänk: id på sektionen i app/page.tsx
};

const MENY: MenyPost[] = [
  { href: "/bostader", label: "Bostäder", matcha: ["/bostader", "/bostad", "/rum"] },
  { href: "/#for-foretag", label: "För företag", sektion: "for-foretag" },
  { href: "/hyresvardar", label: "För hyresvärdar", matcha: ["/hyresvardar"] },
  { href: "/om-oss", label: "Om oss", matcha: ["/om-oss"] },
  { href: "/faq", label: "FAQ", matcha: ["/faq"] },
];

// Sektions-id:n plockas ut ur menyn ovan — läggs en ny sektionslänk till
// börjar den bevakas automatiskt. Konstant på modulnivå så att listan har
// samma identitet vid varje rendering.
const SEKTIONER: string[] = MENY.flatMap((m) => (m.sektion ? [m.sektion] : []));

// ─── Aktiv-markering ─────────────────────────────────────────────────────────

// Exakt match på "/", annars prefixmatch på hel segmentgräns — så att
// "/bostad" inte råkar markera "/bostader" (och "/" inte markerar allt).
function arAktiv(pathname: string, matcha: string[]): boolean {
  return matcha.some((p) =>
    p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`)
  );
}

// Sidlänkar avgörs av adressen, sektionslänkar av var man har scrollat.
function arPostAktiv(
  post: MenyPost,
  pathname: string,
  aktivSektion: string | null
): boolean {
  if (post.sektion) return post.sektion === aktivSektion;
  return arAktiv(pathname, post.matcha ?? []);
}

// Understrecket ligger på en inre span så att det hugger texten även i
// mobilmenyn (där länken är fullbred för tap-ytan). Inaktiva länkar har en
// transparent kant av samma tjocklek — utrymmet är reserverat, inget hopp.
function MenyLank({
  href,
  label,
  aktiv,
  sektionslank,
  mobil,
  onClick,
}: {
  href: string;
  label: string;
  aktiv: boolean;
  /** Sektionslänk får aria-current="true" — den är en del av en sida, inte en egen sida. */
  sektionslank?: boolean;
  mobil?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={aktiv ? (sektionslank ? "true" : "page") : undefined}
      className={`text-sm transition-colors ${mobil ? "py-1" : ""} ${
        aktiv
          ? "text-[#1a1a1a] font-semibold"
          : `${mobil ? "text-gray-700" : "text-gray-600"} hover:text-[#2D7A4F]`
      }`}
    >
      <span
        data-label={label}
        className={`meny-etikett inline-block pb-1 border-b-[3px] ${
          aktiv ? "border-[#2D7A4F]" : "border-transparent"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { session, laddar, setSession } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [offertOpen, setOffertOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Sektionerna finns bara på startsidan — därför bevakas de bara där.
  const aktivSektion = useAktivSektion(SEKTIONER, pathname === "/");

  async function handleLoggaUt() {
    await fetch("/api/auth/logga-ut", { method: "POST" });
    setSession(null);
    router.push("/");
    router.refresh();
  }

  const inloggad = !!session;

  return (
    <>
      <OffertModal open={offertOpen} onClose={() => setOffertOpen(false)} />

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logotyp */}
            <Link href="/" className="flex flex-col leading-none shrink-0">
              <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
                Re<span className="text-[#2D7A4F]">Loka</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                Linköping
              </span>
            </Link>

            {/* Desktop-meny */}
            <div className="hidden md:flex items-center gap-6">
              {MENY.map((m) => (
                <MenyLank
                  key={m.href}
                  href={m.href}
                  label={m.label}
                  aktiv={arPostAktiv(m, pathname, aktivSektion)}
                  sektionslank={!!m.sektion}
                />
              ))}

              {!laddar && (
                inloggad ? (
                  <>
                    <MenyLank
                      href="/dashboard"
                      label="Dashboard"
                      aktiv={arAktiv(pathname, ["/dashboard"])}
                    />
                    <button
                      onClick={handleLoggaUt}
                      className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors pb-1 border-b-[3px] border-transparent"
                    >
                      Logga ut
                    </button>
                  </>
                ) : (
                  <MenyLank
                    href="/logga-in"
                    label="Logga in"
                    aktiv={arAktiv(pathname, ["/logga-in"])}
                  />
                )
              )}

              <button
                onClick={() => setOffertOpen(true)}
                className="text-sm bg-[#2D7A4F] text-white px-4 py-2 rounded-full hover:bg-[#225f3d] transition-colors"
              >
                Få offert
              </button>
            </div>

            {/* Hamburger (mobil) */}
            <button
              type="button"
              className="md:hidden text-gray-600 hover:text-[#2D7A4F] transition-colors p-3 -mr-1"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Öppna meny"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobil-dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3 relative z-50">
            {MENY.map((m) => (
              <MenyLank
                key={m.href}
                href={m.href}
                label={m.label}
                aktiv={arPostAktiv(m, pathname, aktivSektion)}
                sektionslank={!!m.sektion}
                mobil
                onClick={() => setMenuOpen(false)}
              />
            ))}

            {!laddar && (
              inloggad ? (
                <>
                  <MenyLank
                    href="/dashboard"
                    label="Dashboard"
                    aktiv={arAktiv(pathname, ["/dashboard"])}
                    mobil
                    onClick={() => setMenuOpen(false)}
                  />
                  <button
                    onClick={() => { setMenuOpen(false); handleLoggaUt(); }}
                    className="text-sm text-left text-gray-700 hover:text-[#2D7A4F] transition-colors py-1"
                  >
                    <span className="inline-block pb-1 border-b-[3px] border-transparent">
                      Logga ut
                    </span>
                  </button>
                </>
              ) : (
                <MenyLank
                  href="/logga-in"
                  label="Logga in"
                  aktiv={arAktiv(pathname, ["/logga-in"])}
                  mobil
                  onClick={() => setMenuOpen(false)}
                />
              )
            )}

            <button
              onClick={() => { setMenuOpen(false); setOffertOpen(true); }}
              className="text-sm bg-[#2D7A4F] text-white px-4 py-2 rounded-full hover:bg-[#225f3d] transition-colors text-center"
            >
              Få offert
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
