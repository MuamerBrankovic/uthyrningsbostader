"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OffertModal from "@/app/components/OffertModal";

type Session = { userId: string; email: string; namn: string; roll: string } | null;

export default function Navbar() {
  const [session, setSession] = useState<Session>(undefined as unknown as Session);
  const [menuOpen, setMenuOpen] = useState(false);
  const [offertOpen, setOffertOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setSession(data))
      .catch(() => setSession(null));
  }, []);

  async function handleLoggaUt() {
    await fetch("/api/auth/logga-ut", { method: "POST" });
    setSession(null);
    router.push("/");
    router.refresh();
  }

  const inloggad = !!session;
  const laddar = session === (undefined as unknown as Session);

  return (
    <>
      <OffertModal open={offertOpen} onClose={() => setOffertOpen(false)} />

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logotyp */}
            <Link href="/" className="flex flex-col leading-none shrink-0">
              <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">
                Home for <span className="text-[#2D7A4F]">Us</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                Linköping &amp; Norrköping
              </span>
            </Link>

            {/* Desktop-meny */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/bostader" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                Bostäder
              </Link>
              <Link href="/#for-foretag" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                För företag
              </Link>
              <Link href="/hyresvardar" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                För hyresvärdar
              </Link>
              <Link href="/om-oss" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                Om oss
              </Link>
              <Link href="/faq" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                FAQ
              </Link>

              {!laddar && (
                inloggad ? (
                  <>
                    <Link href="/dashboard" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLoggaUt}
                      className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors"
                    >
                      Logga ut
                    </button>
                  </>
                ) : (
                  <Link href="/logga-in" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
                    Logga in
                  </Link>
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
              className="md:hidden text-gray-600 hover:text-[#2D7A4F] transition-colors p-2"
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
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
            <Link href="/bostader" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              Bostäder
            </Link>
            <Link href="/#for-foretag" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              För företag
            </Link>
            <Link href="/hyresvardar" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              För hyresvärdar
            </Link>
            <Link href="/om-oss" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              Om oss
            </Link>
            <Link href="/faq" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
              FAQ
            </Link>

            {!laddar && (
              inloggad ? (
                <>
                  <Link href="/dashboard" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleLoggaUt(); }}
                    className="text-sm text-left text-gray-700 hover:text-[#2D7A4F] transition-colors py-1"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <Link href="/logga-in" className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1" onClick={() => setMenuOpen(false)}>
                  Logga in
                </Link>
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
