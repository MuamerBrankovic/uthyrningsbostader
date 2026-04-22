"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [inloggad, setInloggad] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInloggad(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setInloggad(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLoggaUt() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logotyp */}
          <Link href="/" className="text-lg font-bold tracking-tight text-[#1a1a1a] shrink-0">
            Uthyrnings<span className="text-[#2D7A4F]">Bostäder</span>
          </Link>

          {/* Desktop-meny */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/bostader" className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors">
              Bostäder
            </Link>

            {inloggad ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLoggaUt}
                  className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Logga ut
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/logga-in"
                  className="text-sm text-gray-600 hover:text-[#2D7A4F] transition-colors"
                >
                  Logga in
                </Link>
                <Link
                  href="/registrera"
                  className="text-sm bg-[#2D7A4F] text-white px-4 py-2 rounded-full hover:bg-[#225f3d] transition-colors"
                >
                  Registrera
                </Link>
              </>
            )}
          </div>

          {/* Hamburger-knapp (mobil) */}
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
          <Link
            href="/bostader"
            className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1"
            onClick={() => setMenuOpen(false)}
          >
            Bostäder
          </Link>

          {inloggad ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1"
                onClick={() => setMenuOpen(false)}
              >
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
            <>
              <Link
                href="/logga-in"
                className="text-sm text-gray-700 hover:text-[#2D7A4F] transition-colors py-1"
                onClick={() => setMenuOpen(false)}
              >
                Logga in
              </Link>
              <Link
                href="/registrera"
                className="text-sm bg-[#2D7A4F] text-white px-4 py-2 rounded-full hover:bg-[#225f3d] transition-colors text-center"
                onClick={() => setMenuOpen(false)}
              >
                Registrera
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
