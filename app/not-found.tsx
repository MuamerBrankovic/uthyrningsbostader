import Link from "next/link";

// Visas när en adress inte finns, och när en sida anropar notFound()
// (t.ex. ett rum eller en bostad som tagits bort).
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-semibold text-[#2D7A4F] uppercase tracking-widest mb-4">
          404
        </p>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
          Sidan hittades inte
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Sidan du letar efter finns inte, eller så har den flyttat. Kontrollera
          adressen eller gå vidare härifrån.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-[#2D7A4F] text-white text-sm px-7 py-3 rounded-full hover:bg-[#225f3d] transition-colors font-medium"
          >
            Till startsidan
          </Link>
          <Link
            href="/bostader"
            className="bg-white border border-gray-200 text-[#2D7A4F] text-sm px-7 py-3 rounded-full hover:border-[#2D7A4F] transition-colors font-medium"
          >
            Se lediga bostäder
          </Link>
        </div>
      </div>
    </main>
  );
}
