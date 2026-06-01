"use client";
import { useEffect } from "react";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function OffertModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Få offert"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
          aria-label="Stäng"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-6">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#2D7A4F] bg-[#e8f5ee] px-3 py-1 rounded-full mb-3">
            Kontakta oss
          </span>
          <h2 className="text-2xl font-bold text-[#1a1a1a]">Få en offert</h2>
          <p className="text-gray-500 text-sm mt-2">
            Vi svarar normalt inom 3 timmar på vardagar. Välj hur ni vill kontakta oss.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/offert"
            onClick={onClose}
            className="flex items-center gap-4 w-full bg-[#2D7A4F] text-white rounded-xl px-5 py-4 hover:bg-[#225f3d] transition-colors"
          >
            <span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="15" y2="17" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-green-100 font-medium uppercase tracking-wider">Rekommenderat</p>
              <p className="font-semibold">Fyll i offertformulär</p>
            </div>
          </Link>

          <a
            href="tel:013XXXXXX"
            className="flex items-center gap-4 w-full bg-white border border-gray-200 text-[#1a1a1a] rounded-xl px-5 py-4 hover:border-[#2D7A4F] hover:bg-[#f8fdf9] transition-colors"
          >
            <span className="text-[#2D7A4F]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.2 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ring oss</p>
              <p className="font-semibold">013-XXX XX XX</p>
            </div>
          </a>

          <a
            href="mailto:info@reloka.se"
            className="flex items-center gap-4 w-full bg-white border border-gray-200 text-[#1a1a1a] rounded-xl px-5 py-4 hover:border-[#2D7A4F] hover:bg-[#f8fdf9] transition-colors"
          >
            <span className="text-[#2D7A4F]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mejla oss</p>
              <p className="font-semibold text-[#2D7A4F]">info@reloka.se</p>
            </div>
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Inga förpliktelser. Vi återkommer med ett skräddarsytt förslag.
        </p>
      </div>
    </div>
  );
}
