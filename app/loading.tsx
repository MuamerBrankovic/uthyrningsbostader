// Visas medan en sida hämtas från servern. Samma spinner som sidorna använder
// internt, så växlingen mellan den här och sidans egen laddning inte syns.
export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Laddar...</p>
      </div>
    </main>
  );
}
