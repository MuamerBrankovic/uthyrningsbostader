"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formateraDatum, formateraDatumTid } from "@/lib/datum";
import { useSession, type Session } from "@/app/components/SessionProvider";

type RumInfo = {
  id: string;
  namn: string;
  manadshyra: number;
  bostad: { id: string; namn: string; stadsdel: string | null };
};

type Bokning = {
  id: string;
  kund_kontaktperson: string;
  boende_namn: string | null;
  email: string;
  startdatum: string;
  slutdatum: string | null;
  status: string;
  avtalstyp: string;
  created_at: string;
  rum: RumInfo;
};

type BostadOption = {
  id: string;
  namn: string;
  stadsdel: string | null;
  adress: string | null;
};

type Flik =
  | "bokningar"
  | "allaBokningar"
  | "konto"
  | "laggUppBostad"
  | "laggUppRum"
  | "offerter"
  | "hyresvardsanmalningar";

type AdminBokning = {
  id: string;
  kund_foretag: string | null;
  kund_orgnr: string | null;
  kund_kontaktperson: string;
  boende_namn: string | null;
  email: string;
  telefon: string | null;
  startdatum: string;
  slutdatum: string | null;
  status: string;
  avtalstyp: string;
  kontrakt_url: string | null;
  kontrakt_status: string;
  kontrakt_uppdaterad: string | null;
  faktura_status: string;
  created_at: string;
  rum: RumInfo;
};

type Offert = {
  id: string;
  foretag: string;
  orgnr: string | null;
  kontaktperson: string;
  email: string;
  telefon: string;
  stad: string;
  antal_personer: number | null;
  inflyttning: string | null;
  bostadstyp: string | null;
  meddelande: string | null;
  status: string;
  intern_notering: string | null;
  uppdaterad: string | null;
  created_at: string;
};

type Hyresvardsanmalan = {
  id: string;
  namn: string;
  telefon: string | null;
  email: string;
  stad: string | null;
  adress: string | null;
  meddelande: string | null;
  status: string;
  intern_notering: string | null;
  uppdaterad: string | null;
  created_at: string;
};

function bostadstypLabel(t: string | null): string {
  if (!t) return "—";
  if (t === "privat_rum") return "Privat rum";
  if (t === "rum_eget_bad") return "Rum med eget bad";
  if (t === "hel_lagenhet") return "Hel lägenhet";
  if (t === "vet_ej") return "Vet ej";
  return t;
}

const INPUT_CLS =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors";

const LABEL_CLS =
  "text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2";

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

// ─── Bilduppladdning ─────────────────────────────────────────────────────────

type UploadItem = {
  id: number;
  file: File;
  url: string | null;
  uploading: boolean;
  error: string | null;
};

function BildUppladdning({
  onBilderChange,
  disabled,
}: {
  onBilderChange: (urls: string[]) => void;
  disabled: boolean;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const nextId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synca parent efter varje render där items förändras (korrekt React-mönster)
  useEffect(() => {
    onBilderChange(items.filter((i) => i.url).map((i) => i.url!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function handleFiles(files: FileList) {
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: nextId.current++,
      file,
      url: null,
      uploading: true,
      error: null,
    }));

    setItems((prev) => [...prev, ...newItems]);

    for (const item of newItems) {
      const formData = new FormData();
      formData.append("file", item.file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, url: res.ok ? data.url : null, uploading: false, error: res.ok ? null : (data.error ?? "Fel") }
              : i
          )
        );
      } catch {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, uploading: false, error: "Uppladdning misslyckades" } : i
          )
        );
      }
    }
  }

  function taBort(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const uploading = items.some((i) => i.uploading);

  return (
    <div>
      <label className={LABEL_CLS}>Bilder</label>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
          disabled ? "border-gray-100 cursor-default" : "border-gray-200 hover:border-[#2D7A4F] cursor-pointer"
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[#2D7A4F]">Laddar upp bilder...</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400">Klicka för att välja bilder</p>
            <p className="text-xs text-gray-300 mt-1">jpg, png, webp · max 5 MB per bild</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0"
            >
              {item.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : item.uploading ? (
                <div className="w-5 h-5 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-red-400 text-xs text-center px-1 leading-tight">{item.error ?? "Fel"}</span>
              )}
              {!item.uploading && (
                <button
                  type="button"
                  onClick={() => taBort(item.id)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors leading-none"
                  aria-label="Ta bort bild"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Flik: Mina bokningar ────────────────────────────────────────────────────

function MinaBokningar({ bokningar }: { bokningar: Bokning[] }) {
  if (bokningar.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-4xl mb-4">🏠</p>
        <p className="text-gray-400 text-sm">Du har inga bokningar ännu.</p>
        <a
          href="/bostader"
          className="inline-block mt-4 bg-[#2D7A4F] text-white text-sm px-6 py-2.5 rounded-full hover:bg-[#225f3d] transition-colors"
        >
          Hitta ett rum
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {bokningar.map((b) => (
        <div
          key={b.id}
          className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-4"
        >
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-[#e8f5ee] rounded-xl flex items-center justify-center text-xl shrink-0">
              🛏
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a1a]">{b.rum?.namn}</h3>
              <p className="text-sm text-gray-400">{b.rum?.bostad?.namn}</p>
              <p className="text-xs text-gray-400 mt-1">
                Från {formateraDatum(b.startdatum)}
                {b.slutdatum ? ` → ${formateraDatum(b.slutdatum)}` : " (tills vidare)"}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-2">
            <p className="text-[#2D7A4F] font-bold">
              {b.rum?.manadshyra?.toLocaleString()} kr/mån
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span
                className={`inline-block text-xs px-3 py-1 rounded-full ${
                  b.status === "bekraftad"
                    ? "bg-green-100 text-green-700"
                    : "bg-[#e8f5ee] text-[#2D7A4F]"
                }`}
              >
                {b.status === "bekraftad" ? "Bekräftad" : "Förfrågan skickad"}
              </span>
              <span className="inline-block text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                {b.avtalstyp === "standard" ? "Standard" : b.avtalstyp === "premium" ? "Premium" : "Medlemskap"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Flik: Lägg upp bostad ───────────────────────────────────────────────────

function LaggUppBostad() {
  const [namn, setNamn] = useState("");
  const [adress, setAdress] = useState("");
  const [stadsdel, setStadsdel] = useState("");
  const [bostadstyp, setBostadstyp] = useState("privat_rum");
  const [beskrivning, setBeskrivning] = useState("");
  const [deladeUtrymmen, setDeladeUtrymmen] = useState("");
  const [inkluderat, setInkluderat] = useState("");
  const [bildUrls, setBildUrls] = useState<string[]>([]);
  const [kontaktNamn, setKontaktNamn] = useState("");
  const [kontaktEmail, setKontaktEmail] = useState("");
  const [kontaktTelefon, setKontaktTelefon] = useState("");
  const [kontaktBildUrls, setKontaktBildUrls] = useState<string[]>([]);
  const [sparad, setSparad] = useState(false);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState("");

  async function handleSubmit() {
    if (!namn) return;
    setLaddar(true);
    setFel("");

    const res = await fetch("/api/bostader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namn,
        adress: adress || null,
        stadsdel: stadsdel || null,
        bostadstyp,
        beskrivning: beskrivning || null,
        bilder: bildUrls,
        delade_utrymmen: parseList(deladeUtrymmen),
        inkluderat: parseList(inkluderat),
        kontaktperson_namn: kontaktNamn || null,
        kontaktperson_email: kontaktEmail || null,
        kontaktperson_telefon: kontaktTelefon || null,
        kontaktperson_bild: kontaktBildUrls[0] ?? null,
      }),
    });

    if (res.ok) {
      setSparad(true);
      setNamn("");
      setAdress("");
      setStadsdel("");
      setBostadstyp("privat_rum");
      setBeskrivning("");
      setDeladeUtrymmen("");
      setInkluderat("");
      setBildUrls([]);
      setKontaktNamn("");
      setKontaktEmail("");
      setKontaktTelefon("");
      setKontaktBildUrls([]);
      setTimeout(() => setSparad(false), 5000);
    } else {
      const data = await res.json();
      setFel(data.error ?? "Något gick fel.");
    }
    setLaddar(false);
  }

  const submitDisabled = !namn || laddar;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <h2 className="font-semibold text-[#1a1a1a] mb-1">Lägg upp en ny bostad</h2>
      <p className="text-sm text-gray-400 mb-6">
        Skapa bostaden här, lägg sedan till rum under fliken "Lägg upp rum".
      </p>

      {sparad && (
        <div className="bg-[#e8f5ee] text-[#2D7A4F] text-sm px-4 py-3 rounded-xl mb-6">
          ✓ Bostaden har lagts upp! Gå till fliken{" "}
          <span className="underline font-medium">Lägg upp rum</span>{" "}
          för att lägga till rum.
        </div>
      )}

      {fel && (
        <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
          {fel}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div>
          <label className={LABEL_CLS}>
            Bostadens namn <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="t.ex. Hagagatan 12"
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Stadsdel</label>
          <input
            type="text"
            placeholder="t.ex. Södermalm"
            value={stadsdel}
            onChange={(e) => setStadsdel(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Adress</label>
          <input
            type="text"
            placeholder="t.ex. Hagagatan 12, 113 47 Stockholm"
            value={adress}
            onChange={(e) => setAdress(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Bostadstyp</label>
          <select
            value={bostadstyp}
            onChange={(e) => setBostadstyp(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="privat_rum">Privat rum</option>
            <option value="rum_eget_bad">Rum med eget bad</option>
            <option value="hel_lagenhet">Hel lägenhet</option>
          </select>
        </div>
      </div>

      <div className="mb-5">
        <label className={LABEL_CLS}>Beskrivning</label>
        <textarea
          placeholder="Beskriv bostaden och dess omgivning..."
          value={beskrivning}
          onChange={(e) => setBeskrivning(e.target.value)}
          rows={3}
          className={`${INPUT_CLS} resize-none`}
        />
      </div>

      <div className="mb-5">
        <label className={LABEL_CLS}>
          Delade utrymmen{" "}
          <span className="normal-case font-normal">(separera med komma)</span>
        </label>
        <input
          type="text"
          placeholder="t.ex. Gemensamt kök, Vardagsrum, Badrum"
          value={deladeUtrymmen}
          onChange={(e) => setDeladeUtrymmen(e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      <div className="mb-5">
        <label className={LABEL_CLS}>
          Vad ingår{" "}
          <span className="normal-case font-normal">(separera med komma)</span>
        </label>
        <input
          type="text"
          placeholder="t.ex. El, Vatten, Bredband, TV-avgift"
          value={inkluderat}
          onChange={(e) => setInkluderat(e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      <div className="mb-8">
        <BildUppladdning
          onBilderChange={setBildUrls}
          disabled={laddar}
        />
      </div>

      {/* KONTAKTPERSON */}
      <div className="border-t border-gray-100 pt-6 mb-8">
        <h3 className="font-semibold text-[#1a1a1a] mb-1 text-sm">Kontaktperson</h3>
        <p className="text-xs text-gray-400 mb-5">Visas för hyresgäster på rumssidan (valfritt)</p>
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className={LABEL_CLS}>Namn</label>
            <input type="text" placeholder="Anna Svensson" value={kontaktNamn}
              onChange={(e) => setKontaktNamn(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Telefon</label>
            <input type="tel" placeholder="070-000 00 00" value={kontaktTelefon}
              onChange={(e) => setKontaktTelefon(e.target.value)} className={INPUT_CLS} />
          </div>
          <div className="md:col-span-2">
            <label className={LABEL_CLS}>E-post</label>
            <input type="email" placeholder="anna@exempel.se" value={kontaktEmail}
              onChange={(e) => setKontaktEmail(e.target.value)} className={INPUT_CLS} />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Profilbild <span className="normal-case font-normal">(valfritt)</span></label>
          <BildUppladdning onBilderChange={setKontaktBildUrls} disabled={laddar} />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitDisabled}
        className="bg-[#2D7A4F] text-white text-sm px-8 py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
      >
        {laddar ? "Sparar..." : "Lägg upp bostad"}
      </button>
    </div>
  );
}

// ─── Flik: Lägg upp rum ──────────────────────────────────────────────────────

function LaggUppRum() {
  const [bostader, setBostader] = useState<BostadOption[]>([]);
  const [hamtarBostader, setHamtarBostader] = useState(true);
  const [bostadId, setBostadId] = useState("");
  const [namn, setNamn] = useState("");
  const [beskrivning, setBeskrivning] = useState("");
  const [kvm, setKvm] = useState("");
  const [manadshyra, setManadshyra] = useState("");
  const [moblering, setMoblering] = useState("");
  const [bildUrls, setBildUrls] = useState<string[]>([]);
  const [sparad, setSparad] = useState(false);
  const [laddar, setLaddar] = useState(false);
  const [fel, setFel] = useState("");

  useEffect(() => {
    fetch("/api/bostader")
      .then((r) => r.json())
      .then((data) => {
        setBostader(Array.isArray(data) ? data : []);
        setHamtarBostader(false);
      })
      .catch(() => setHamtarBostader(false));
  }, []);

  async function handleSubmit() {
    if (!bostadId || !namn || !manadshyra) return;
    setLaddar(true);
    setFel("");

    const res = await fetch("/api/rum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bostad_id: bostadId,
        namn,
        beskrivning: beskrivning || null,
        kvm: kvm ? Number(kvm) : null,
        manadshyra: Number(manadshyra),
        bilder: bildUrls,
        moblering: parseList(moblering),
      }),
    });

    if (res.ok) {
      setSparad(true);
      setNamn("");
      setBeskrivning("");
      setKvm("");
      setManadshyra("");
      setMoblering("");
      setBildUrls([]);
      setTimeout(() => setSparad(false), 5000);
    } else {
      const data = await res.json();
      setFel(data.error ?? "Något gick fel.");
    }
    setLaddar(false);
  }

  const valdBostad = bostader.find((b) => b.id === bostadId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <h2 className="font-semibold text-[#1a1a1a] mb-1">Lägg till ett rum</h2>
      <p className="text-sm text-gray-400 mb-6">
        Välj vilken bostad rummet tillhör och fyll i rumsuppgifterna.
      </p>

      {sparad && (
        <div className="bg-[#e8f5ee] text-[#2D7A4F] text-sm px-4 py-3 rounded-xl mb-6">
          ✓ Rummet har lagts till!{" "}
          {valdBostad && (
            <Link href={`/bostad/${valdBostad.id}`} className="underline font-medium">
              Visa {valdBostad.namn} →
            </Link>
          )}
        </div>
      )}

      {fel && (
        <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-6">
          {fel}
        </div>
      )}

      {/* VÄLJ BOSTAD */}
      <div className="mb-6">
        <label className={LABEL_CLS}>
          Bostad <span className="text-red-400">*</span>
        </label>
        {hamtarBostader ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
            <div className="w-4 h-4 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin" />
            Hämtar bostäder...
          </div>
        ) : bostader.length === 0 ? (
          <div className="bg-[#F8F7F4] rounded-xl px-4 py-3 text-sm text-gray-500">
            Inga bostäder hittades. Lägg upp en bostad först under fliken{" "}
            <span className="font-medium text-[#2D7A4F]">Lägg upp bostad</span>.
          </div>
        ) : (
          <select
            value={bostadId}
            onChange={(e) => setBostadId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors bg-white"
          >
            <option value="">— Välj bostad —</option>
            {bostader.map((b) => (
              <option key={b.id} value={b.id}>
                {b.namn}
                {b.stadsdel ? ` · ${b.stadsdel}` : ""}
                {b.adress ? ` (${b.adress})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* RUMSUPPGIFTER */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="md:col-span-2">
          <label className={LABEL_CLS}>
            Rumsnamn <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="t.ex. Rum 1, Enkelrum norra, Mästarsvitten"
            value={namn}
            onChange={(e) => setNamn(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Storlek (kvm)</label>
          <input
            type="number"
            min="1"
            placeholder="t.ex. 12"
            value={kvm}
            onChange={(e) => setKvm(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>
            Månadshyra (kr) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min="0"
            placeholder="t.ex. 8500"
            value={manadshyra}
            onChange={(e) => setManadshyra(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="mb-5">
        <label className={LABEL_CLS}>Beskrivning</label>
        <textarea
          placeholder="Beskriv rummet, läge i bostaden, ljusinsläpp..."
          value={beskrivning}
          onChange={(e) => setBeskrivning(e.target.value)}
          rows={3}
          className={`${INPUT_CLS} resize-none`}
        />
      </div>

      <div className="mb-5">
        <label className={LABEL_CLS}>
          Möblering{" "}
          <span className="normal-case font-normal">(separera med komma)</span>
        </label>
        <input
          type="text"
          placeholder="t.ex. Säng 90cm, Skrivbord, Garderob, Stol"
          value={moblering}
          onChange={(e) => setMoblering(e.target.value)}
          className={INPUT_CLS}
        />
      </div>

      <div className="mb-8">
        <BildUppladdning
          onBilderChange={setBildUrls}
          disabled={laddar}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!bostadId || !namn || !manadshyra || laddar}
        className="bg-[#2D7A4F] text-white text-sm px-8 py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
      >
        {laddar ? "Sparar..." : "Lägg till rum"}
      </button>
    </div>
  );
}

// ─── Flik: Offertförfrågningar (admin) ───────────────────────────────────────

// ─── Lead-uppföljning (offert + hyresvärd): delad infrastruktur ──────────────

type LeadStatusMeta = {
  label: string; // dropdown + badge, t.ex. "Obehandlad"
  en: string; // räknare singular, t.ex. "obehandlad"
  flera: string; // räknare plural, t.ex. "obehandlade"
  grupp: "obehandlad" | "aktiv" | "avslutad";
  badge: string; // Tailwind-klasser för badge
};
type LeadConfig = { ordning: string[]; meta: Record<string, LeadStatusMeta> };

type LeadItem = {
  id: string;
  status: string;
  intern_notering: string | null;
  uppdaterad: string | null;
  created_at: string;
};

const BADGE_OBEHANDLAD = "bg-[#e8f5ee] text-[#2D7A4F]"; // grön accent — kräver handling
const BADGE_AMBER = "bg-amber-100 text-amber-700";
const BADGE_BLA = "bg-blue-100 text-blue-700";
const BADGE_VUNNEN = "bg-[#2D7A4F] text-white"; // fylld grön
const BADGE_GRA = "bg-gray-100 text-gray-500";

const OFFERT_CONFIG: LeadConfig = {
  ordning: ["obehandlad", "kontaktad", "offert_skickad", "vunnen", "forlorad"],
  meta: {
    obehandlad: { label: "Obehandlad", en: "obehandlad", flera: "obehandlade", grupp: "obehandlad", badge: BADGE_OBEHANDLAD },
    kontaktad: { label: "Kontaktad", en: "kontaktad", flera: "kontaktade", grupp: "aktiv", badge: BADGE_AMBER },
    offert_skickad: { label: "Offert skickad", en: "offert skickad", flera: "offert skickade", grupp: "aktiv", badge: BADGE_BLA },
    vunnen: { label: "Vunnen", en: "vunnen", flera: "vunna", grupp: "avslutad", badge: BADGE_VUNNEN },
    forlorad: { label: "Förlorad", en: "förlorad", flera: "förlorade", grupp: "avslutad", badge: BADGE_GRA },
  },
};

const HYRESVARD_CONFIG: LeadConfig = {
  ordning: ["obehandlad", "kontaktad", "pagaende", "avtal_klart", "ej_aktuell"],
  meta: {
    obehandlad: { label: "Obehandlad", en: "obehandlad", flera: "obehandlade", grupp: "obehandlad", badge: BADGE_OBEHANDLAD },
    kontaktad: { label: "Kontaktad", en: "kontaktad", flera: "kontaktade", grupp: "aktiv", badge: BADGE_AMBER },
    pagaende: { label: "Pågående", en: "pågående", flera: "pågående", grupp: "aktiv", badge: BADGE_AMBER },
    avtal_klart: { label: "Avtal klart", en: "avtal klart", flera: "avtal klara", grupp: "avslutad", badge: BADGE_VUNNEN },
    ej_aktuell: { label: "Ej aktuell", en: "ej aktuell", flera: "ej aktuella", grupp: "avslutad", badge: BADGE_GRA },
  },
};

const GRUPP_RANK: Record<string, number> = { obehandlad: 0, aktiv: 1, avslutad: 2 };

// Okänd status (inkl. legacy "ny") behandlas som obehandlad → syns som lead att ta tag i
function leadMeta(config: LeadConfig, status: string): LeadStatusMeta {
  return config.meta[status] ?? config.meta.obehandlad;
}

function LeadBadge({ config, status }: { config: LeadConfig; status: string }) {
  const m = leadMeta(config, status);
  return <span className={`text-xs font-medium px-3 py-1 rounded-full ${m.badge}`}>{m.label}</span>;
}

function LeadRaknare({ config, statusar }: { config: LeadConfig; statusar: string[] }) {
  const antal: Record<string, number> = {};
  for (const s of statusar) {
    const key = config.meta[s] ? s : "obehandlad";
    antal[key] = (antal[key] ?? 0) + 1;
  }
  const obeh = antal["obehandlad"] ?? 0;
  const ovriga = config.ordning
    .filter((k) => k !== "obehandlad" && (antal[k] ?? 0) > 0)
    .map((k) => `${antal[k]} ${config.meta[k].flera}`);

  return (
    <div className="flex items-center gap-3 flex-wrap mb-6">
      {obeh > 0 ? (
        <span className="inline-flex items-center gap-2 text-sm font-semibold bg-[#e8f5ee] text-[#2D7A4F] px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-[#2D7A4F]" />
          {obeh} {obeh === 1 ? config.meta.obehandlad.en : config.meta.obehandlad.flera} — kräver handling
        </span>
      ) : (
        <span className="text-sm text-gray-400">Inga obehandlade just nu</span>
      )}
      {ovriga.length > 0 && <span className="text-sm text-gray-400">{ovriga.join(" · ")}</span>}
    </div>
  );
}

function LeadMeddelande({ text }: { text: string }) {
  const [expanderad, setExpanderad] = useState(false);
  const MAXLANGD = 220;
  const arLangt = text.length > MAXLANGD;
  const visat = expanderad || !arLangt ? text : text.slice(0, MAXLANGD).trimEnd() + "…";
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Meddelande</p>
      <p className="text-sm text-gray-700 whitespace-pre-line">{visat}</p>
      {arLangt && (
        <button
          onClick={() => setExpanderad((v) => !v)}
          className="text-xs text-[#2D7A4F] hover:underline mt-1 font-medium"
        >
          {expanderad ? "Visa mindre" : "Visa mer"}
        </button>
      )}
    </div>
  );
}

function LeadKort({
  config,
  endpoint,
  item,
  header,
  fakta,
  meddelande,
  onChange,
}: {
  config: LeadConfig;
  endpoint: string;
  item: LeadItem;
  header: React.ReactNode;
  fakta: React.ReactNode;
  meddelande: string | null;
  onChange: (partial: Partial<LeadItem>) => void;
}) {
  const meta = leadMeta(config, item.status);
  const avslutad = meta.grupp === "avslutad";
  const [sparar, setSparar] = useState(false);
  const [fel, setFel] = useState("");
  const [notering, setNotering] = useState(item.intern_notering ?? "");
  const [noteringSparad, setNoteringSparad] = useState(false);

  async function patch(data: { status?: string; intern_notering?: string | null }) {
    const res = await fetch(`${endpoint}/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const svar = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(svar.error ?? "Kunde inte spara");
    return svar;
  }

  async function bytStatus(nyStatus: string) {
    const gammal = item.status;
    setFel("");
    onChange({ status: nyStatus }); // optimistiskt — ärendet grupperas om direkt
    try {
      const svar = await patch({ status: nyStatus });
      onChange({ status: svar.status, uppdaterad: svar.uppdaterad });
    } catch (e) {
      onChange({ status: gammal }); // rulla tillbaka vid fel
      setFel(e instanceof Error ? e.message : "Kunde inte spara statusen");
    }
  }

  async function sparaNotering() {
    setSparar(true);
    setFel("");
    setNoteringSparad(false);
    try {
      const svar = await patch({ intern_notering: notering });
      onChange({ intern_notering: svar.intern_notering, uppdaterad: svar.uppdaterad });
      setNoteringSparad(true);
      setTimeout(() => setNoteringSparad(false), 3000);
    } catch (e) {
      setFel(e instanceof Error ? e.message : "Kunde inte spara anteckningen");
    }
    setSparar(false);
  }

  const oandradNotering = notering === (item.intern_notering ?? "");

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 transition-opacity ${avslutad ? "opacity-60" : ""}`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
        <div className="min-w-0">{header}</div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <LeadBadge config={config} status={item.status} />
          <select
            value={config.meta[item.status] ? item.status : "obehandlad"}
            onChange={(e) => bytStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#2D7A4F] bg-white"
            aria-label="Ändra status"
          >
            {config.ordning.map((k) => (
              <option key={k} value={k}>
                {config.meta[k].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">{fakta}</div>

      {meddelande && <LeadMeddelande text={meddelande} />}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
          Intern anteckning{" "}
          <span className="normal-case font-normal text-gray-300">(syns bara för admin)</span>
        </label>
        <textarea
          value={notering}
          onChange={(e) => {
            setNotering(e.target.value);
            setNoteringSparad(false);
          }}
          rows={2}
          maxLength={2000}
          placeholder="T.ex. ringde 12/7, återkommer nästa vecka…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-[#2D7A4F] transition-colors resize-y"
        />
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <button
            onClick={sparaNotering}
            disabled={sparar || oandradNotering}
            className="text-xs bg-[#2D7A4F] text-white px-4 py-1.5 rounded-full hover:bg-[#225f3d] transition-colors disabled:opacity-40 font-medium"
          >
            {sparar ? "Sparar…" : "Spara anteckning"}
          </button>
          {noteringSparad && <span className="text-xs text-[#2D7A4F] font-medium">✓ Sparat</span>}
          {item.uppdaterad && (
            <span className="text-xs text-gray-400">Uppdaterad {formateraDatumTid(item.uppdaterad)}</span>
          )}
        </div>
        {fel && <p className="text-xs text-red-500 mt-2">{fel}</p>}
      </div>
    </div>
  );
}

function LeadFlik<T extends LeadItem>({
  endpoint,
  config,
  tomText,
  felText,
  renderHeader,
  renderFakta,
  getMeddelande,
}: {
  endpoint: string;
  config: LeadConfig;
  tomText: string;
  felText: string;
  renderHeader: (item: T) => React.ReactNode;
  renderFakta: (item: T) => React.ReactNode;
  getMeddelande: (item: T) => string | null;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState("");

  useEffect(() => {
    fetch(endpoint)
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          setFel(data.error ?? felText);
          return [];
        }
        return r.json();
      })
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLaddar(false);
      })
      .catch(() => {
        setFel(felText);
        setLaddar(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function uppdateraItem(id: string, partial: Partial<LeadItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...partial } : it)));
  }

  if (laddar) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-6 h-6 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (fel && items.length === 0) {
    return <div className="bg-red-50 text-red-500 rounded-2xl p-6 text-sm">{fel}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-sm">{tomText}</p>
      </div>
    );
  }

  // Obehandlade överst, sedan aktiva, sedan avslutade; nyast först inom varje grupp
  const sorterade = [...items].sort((a, b) => {
    const rankDiff = GRUPP_RANK[leadMeta(config, a.status).grupp] - GRUPP_RANK[leadMeta(config, b.status).grupp];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      <LeadRaknare config={config} statusar={items.map((i) => i.status)} />
      {fel && <div className="bg-red-50 text-red-500 rounded-2xl p-4 text-sm mb-4">{fel}</div>}
      <div className="flex flex-col gap-4">
        {sorterade.map((item) => (
          <LeadKort
            key={item.id}
            config={config}
            endpoint={endpoint}
            item={item}
            header={renderHeader(item)}
            fakta={renderFakta(item)}
            meddelande={getMeddelande(item)}
            onChange={(partial) => uppdateraItem(item.id, partial)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Flik: Offertförfrågningar (admin) ───────────────────────────────────────

function Offertforfragningar() {
  return (
    <LeadFlik<Offert>
      endpoint="/api/offert"
      config={OFFERT_CONFIG}
      tomText="Inga offertförfrågningar ännu."
      felText="Kunde inte hämta offertförfrågningar"
      getMeddelande={(o) => o.meddelande}
      renderHeader={(o) => (
        <>
          <h3 className="font-semibold text-[#1a1a1a] text-lg truncate">{o.foretag}</h3>
          <p className="text-sm text-gray-500">
            {o.kontaktperson} · {o.stad}
          </p>
        </>
      )}
      renderFakta={(o) => (
        <>
          <FaktaRad label="E-post" varde={
            <a href={`mailto:${o.email}`} className="text-[#2D7A4F] hover:underline break-all">{o.email}</a>
          } />
          <FaktaRad label="Telefon" varde={
            <a href={`tel:${o.telefon}`} className="text-[#2D7A4F] hover:underline">{o.telefon}</a>
          } />
          <FaktaRad label="Org.nr" varde={o.orgnr ?? "—"} />
          <FaktaRad label="Antal personer" varde={o.antal_personer != null ? String(o.antal_personer) : "—"} />
          <FaktaRad label="Inflyttning" varde={o.inflyttning ? formateraDatum(o.inflyttning) : "—"} />
          <FaktaRad label="Bostadstyp" varde={bostadstypLabel(o.bostadstyp)} />
          <FaktaRad label="Inkom" varde={formateraDatum(o.created_at)} />
        </>
      )}
    />
  );
}

// ─── Flik: Hyresvärdsanmälningar (admin) ─────────────────────────────────────

function Hyresvardsanmalningar() {
  return (
    <LeadFlik<Hyresvardsanmalan>
      endpoint="/api/hyresvardar"
      config={HYRESVARD_CONFIG}
      tomText="Inga hyresvärdsanmälningar ännu."
      felText="Kunde inte hämta anmälningar"
      getMeddelande={(a) => a.meddelande}
      renderHeader={(a) => (
        <>
          <h3 className="font-semibold text-[#1a1a1a] text-lg truncate">{a.namn}</h3>
          {a.stad && <p className="text-sm text-gray-500">{a.stad}</p>}
        </>
      )}
      renderFakta={(a) => (
        <>
          <FaktaRad label="E-post" varde={
            <a href={`mailto:${a.email}`} className="text-[#2D7A4F] hover:underline break-all">{a.email}</a>
          } />
          <FaktaRad label="Telefon" varde={
            a.telefon ? <a href={`tel:${a.telefon}`} className="text-[#2D7A4F] hover:underline">{a.telefon}</a> : "—"
          } />
          <FaktaRad label="Adress" varde={a.adress ?? "—"} />
          <FaktaRad label="Inkom" varde={formateraDatum(a.created_at)} />
        </>
      )}
    />
  );
}

// ─── Flik: Alla bokningar (admin) ────────────────────────────────────────────

function BokningStatusBadge({ status }: { status: string }) {
  if (status === "bekraftad") {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
        Bekräftad
      </span>
    );
  }
  if (status === "avbokad") {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
        Avbokad
      </span>
    );
  }
  return (
    <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
      Förfrågan
    </span>
  );
}

function KontraktStatusBadge({ status }: { status: string }) {
  const stil: Record<string, { cls: string; label: string }> = {
    saknas: { cls: "bg-gray-100 text-gray-500", label: "Saknas" },
    uppladdat: { cls: "bg-blue-100 text-blue-700", label: "Uppladdat" },
    skickat: { cls: "bg-yellow-100 text-yellow-700", label: "Skickat" },
    signerat: { cls: "bg-green-100 text-green-700", label: "Signerat" },
  };
  const s = stil[status] ?? stil.saknas;
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  );
}

function FakturaStatusBadge({ status }: { status: string }) {
  const stil: Record<string, { cls: string; label: string }> = {
    ej_fakturerad: { cls: "bg-gray-100 text-gray-500", label: "Ej fakturerad" },
    fakturerad: { cls: "bg-yellow-100 text-yellow-700", label: "Fakturerad" },
    betald: { cls: "bg-green-100 text-green-700", label: "Betald" },
  };
  const s = stil[status] ?? stil.ej_fakturerad;
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  );
}

const SELECT_LITEN_CLS =
  "border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#2D7A4F] bg-white";

function KontraktSektion({
  bokning,
  arbetar,
  onPatch,
  onUppladdat,
}: {
  bokning: AdminBokning;
  arbetar: boolean;
  onPatch: (data: { kontrakt_status?: string; faktura_status?: string }) => void;
  onUppladdat: (partial: Partial<AdminBokning>) => void;
}) {
  const filRef = useRef<HTMLInputElement>(null);
  const [laddarUpp, setLaddarUpp] = useState(false);
  const [uploadFel, setUploadFel] = useState("");

  async function laddaUpp(fil: File) {
    setLaddarUpp(true);
    setUploadFel("");
    const fd = new FormData();
    fd.append("file", fil);
    fd.append("bokning_id", bokning.id);
    try {
      const res = await fetch("/api/kontrakt", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        onUppladdat(data);
      } else {
        setUploadFel(data?.error ?? "Uppladdningen misslyckades");
      }
    } catch {
      setUploadFel("Uppladdningen misslyckades");
    }
    setLaddarUpp(false);
  }

  const upptagen = arbetar || laddarUpp;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-x-6 gap-y-4">
      {/* ── Kontrakt ── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Kontrakt
          </span>
          <KontraktStatusBadge status={bokning.kontrakt_status} />
          {bokning.kontrakt_uppdaterad && (
            <span className="text-xs text-gray-400">
              {formateraDatum(bokning.kontrakt_uppdaterad)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={filRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const fil = e.target.files?.[0];
              if (fil) laddaUpp(fil);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => filRef.current?.click()}
            disabled={upptagen}
            className="text-xs bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-full hover:border-[#2D7A4F] hover:text-[#2D7A4F] transition-colors disabled:opacity-40 font-medium"
          >
            {laddarUpp ? "Laddar upp..." : bokning.kontrakt_url ? "Ersätt PDF" : "Ladda upp PDF"}
          </button>
          {bokning.kontrakt_url && (
            <a
              href={bokning.kontrakt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2D7A4F] hover:underline font-medium"
            >
              Visa kontrakt
            </a>
          )}
          <select
            value={bokning.kontrakt_status}
            onChange={(e) => onPatch({ kontrakt_status: e.target.value })}
            disabled={upptagen}
            className={SELECT_LITEN_CLS}
            aria-label="Kontraktstatus"
          >
            <option value="saknas">Saknas</option>
            <option value="uppladdat">Uppladdat</option>
            <option value="skickat">Skickat</option>
            <option value="signerat">Signerat</option>
          </select>
        </div>
        <div className="mt-2">
          <button
            disabled
            title="Scrive-integration kommer snart"
            className="text-xs bg-gray-50 border border-gray-100 text-gray-300 px-4 py-1.5 rounded-full cursor-not-allowed font-medium"
          >
            Skicka för e-signering
          </button>
          <span className="text-xs text-gray-400 ml-2">Scrive-integration kommer snart</span>
        </div>
        {uploadFel && <p className="text-xs text-red-500 mt-2">{uploadFel}</p>}
      </div>

      {/* ── Fakturering ── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Fakturering
          </span>
          <FakturaStatusBadge status={bokning.faktura_status} />
        </div>
        {bokning.status === "bekraftad" ? (
          <>
            <select
              value={bokning.faktura_status}
              onChange={(e) => onPatch({ faktura_status: e.target.value })}
              disabled={upptagen}
              className={SELECT_LITEN_CLS}
              aria-label="Fakturastatus"
            >
              <option value="ej_fakturerad">Ej fakturerad</option>
              <option value="fakturerad">Fakturerad</option>
              <option value="betald">Betald</option>
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Fakturering sker manuellt. Integration med bokföringssystem (Fortnox/Bokio) planeras.
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400">Faktureras efter att bokningen bekräftats.</p>
        )}
      </div>
    </div>
  );
}

function AllaBokningar() {
  const [bokningar, setBokningar] = useState<AdminBokning[]>([]);
  const [laddar, setLaddar] = useState(true);
  const [fel, setFel] = useState("");
  const [uppdaterarId, setUppdaterarId] = useState<string | null>(null);
  const [slutdatumInput, setSlutdatumInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/bokningar?alla=1")
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          setFel(data.error ?? "Kunde inte hämta bokningar");
          return [];
        }
        return r.json();
      })
      .then((data) => {
        setBokningar(Array.isArray(data) ? data : []);
        setLaddar(false);
      })
      .catch(() => {
        setFel("Kunde inte hämta bokningar");
        setLaddar(false);
      });
  }, []);

  async function uppdatera(
    id: string,
    data: {
      status?: string;
      slutdatum?: string | null;
      kontrakt_status?: string;
      faktura_status?: string;
    }
  ) {
    setUppdaterarId(id);
    setFel("");
    try {
      const res = await fetch(`/api/bokningar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const svar = await res.json().catch(() => null);
      if (res.ok && svar) {
        setBokningar((prev) => prev.map((b) => (b.id === id ? { ...b, ...svar } : b)));
      } else {
        setFel(svar?.error ?? "Kunde inte uppdatera bokningen");
      }
    } catch {
      setFel("Kunde inte uppdatera bokningen");
    }
    setUppdaterarId(null);
  }

  if (laddar) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-6 h-6 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (bokningar.length === 0 && !fel) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-400 text-sm">Inga bokningar ännu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {fel && (
        <div className="bg-red-50 text-red-500 rounded-2xl p-4 text-sm">{fel}</div>
      )}
      {bokningar.map((b) => {
        const arbetar = uppdaterarId === b.id;
        return (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-[#1a1a1a] text-lg">
                  {b.rum?.namn} · {b.rum?.bostad?.namn}
                </h3>
                <p className="text-sm text-gray-500">
                  {b.kund_kontaktperson}
                  {b.kund_foretag ? ` · ${b.kund_foretag}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <BokningStatusBadge status={b.status} />
                <span className="text-xs text-gray-400">{formateraDatum(b.created_at)}</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <FaktaRad label="E-post" varde={
                <a href={`mailto:${b.email}`} className="text-[#2D7A4F] hover:underline">{b.email}</a>
              } />
              <FaktaRad label="Telefon" varde={
                b.telefon ? <a href={`tel:${b.telefon}`} className="text-[#2D7A4F] hover:underline">{b.telefon}</a> : "—"
              } />
              <FaktaRad label="Org.nr" varde={b.kund_orgnr ?? "—"} />
              <FaktaRad label="Boende" varde={b.boende_namn ?? "—"} />
              <FaktaRad label="Startdatum" varde={formateraDatum(b.startdatum)} />
              <FaktaRad label="Slutdatum" varde={b.slutdatum ? formateraDatum(b.slutdatum) : "Tills vidare"} />
              <FaktaRad label="Hyra" varde={`${b.rum?.manadshyra?.toLocaleString()} kr/mån`} />
              <FaktaRad label="Avtalstyp" varde={
                b.avtalstyp === "premium" ? "Premium" : b.avtalstyp === "medlemskap" ? "Medlemskap" : "Standard"
              } />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
              {b.status === "forfragan" && (
                <button
                  onClick={() => uppdatera(b.id, { status: "bekraftad" })}
                  disabled={arbetar}
                  className="text-sm bg-[#2D7A4F] text-white px-5 py-2 rounded-full hover:bg-[#225f3d] transition-colors disabled:opacity-40 font-medium"
                >
                  {arbetar ? "Sparar..." : "Bekräfta"}
                </button>
              )}
              {b.status !== "avbokad" && (
                <button
                  onClick={() => {
                    if (confirm("Avboka denna bokning?")) {
                      uppdatera(b.id, { status: "avbokad" });
                    }
                  }}
                  disabled={arbetar}
                  className="text-sm bg-white border border-gray-200 text-gray-600 px-5 py-2 rounded-full hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-40 font-medium"
                >
                  Avboka
                </button>
              )}
              {b.status === "bekraftad" && (
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="date"
                    value={slutdatumInput[b.id] ?? ""}
                    onChange={(e) =>
                      setSlutdatumInput((prev) => ({ ...prev, [b.id]: e.target.value }))
                    }
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#2D7A4F]"
                    disabled={arbetar}
                  />
                  <button
                    onClick={() => uppdatera(b.id, { slutdatum: slutdatumInput[b.id] || null })}
                    disabled={arbetar || !slutdatumInput[b.id]}
                    className="text-sm bg-white border border-gray-200 text-[#2D7A4F] px-4 py-1.5 rounded-full hover:border-[#2D7A4F] transition-colors disabled:opacity-40 font-medium"
                  >
                    Sätt slutdatum
                  </button>
                </div>
              )}
            </div>

            <KontraktSektion
              bokning={b}
              arbetar={arbetar}
              onPatch={(data) => uppdatera(b.id, data)}
              onUppladdat={(partial) =>
                setBokningar((prev) =>
                  prev.map((x) => (x.id === b.id ? { ...x, ...partial } : x))
                )
              }
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Flik: Mitt konto (alla inloggade) ──────────────────────────────────────

function MittKonto({ session }: { session: NonNullable<Session> }) {
  const [nuvarande, setNuvarande] = useState("");
  const [nyttLosenord, setNyttLosenord] = useState("");
  const [bekrafta, setBekrafta] = useState("");
  const [laddar, setLaddar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fel, setFel] = useState("");

  const matchar = nyttLosenord !== "" && nyttLosenord === bekrafta;
  const tillrackligtLangt = nyttLosenord.length >= 8;
  const kanSpara = nuvarande.length > 0 && tillrackligtLangt && matchar && !laddar;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kanSpara) return;
    setLaddar(true);
    setFel("");
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/byt-losenord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nuvarandeLosenord: nuvarande,
          nyttLosenord,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
        setNuvarande("");
        setNyttLosenord("");
        setBekrafta("");
        setTimeout(() => setSuccess(false), 6000);
      } else {
        setFel(data.error ?? "Kunde inte byta lösenord");
      }
    } catch {
      setFel("Kunde inte skicka. Kontrollera anslutningen.");
    }
    setLaddar(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 max-w-xl">
      <h2 className="font-semibold text-[#1a1a1a] mb-1">Kontouppgifter</h2>
      <p className="text-sm text-gray-400 mb-6">
        Inloggad som <span className="text-[#1a1a1a] font-medium">{session.email}</span>
      </p>

      <div className="border-t border-gray-100 pt-6">
        <h3 className="font-semibold text-[#1a1a1a] mb-1">Byt lösenord</h3>
        <p className="text-xs text-gray-400 mb-5">
          Minst 8 tecken. Använd ett unikt lösenord du inte använder någon annanstans.
        </p>

        {success && (
          <div className="bg-[#e8f5ee] text-[#2D7A4F] text-sm px-4 py-3 rounded-xl mb-5">
            ✓ Lösenordet har bytts.
          </div>
        )}

        {fel && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl mb-5">
            {fel}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Nuvarande lösenord</label>
            <input
              type="password"
              autoComplete="current-password"
              value={nuvarande}
              onChange={(e) => setNuvarande(e.target.value)}
              className={INPUT_CLS}
              disabled={laddar}
              required
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Nytt lösenord</label>
            <input
              type="password"
              autoComplete="new-password"
              value={nyttLosenord}
              onChange={(e) => setNyttLosenord(e.target.value)}
              className={INPUT_CLS}
              disabled={laddar}
              required
              minLength={8}
            />
            {nyttLosenord.length > 0 && !tillrackligtLangt && (
              <p className="text-xs text-red-400 mt-1">Minst 8 tecken</p>
            )}
          </div>
          <div>
            <label className={LABEL_CLS}>Bekräfta nytt lösenord</label>
            <input
              type="password"
              autoComplete="new-password"
              value={bekrafta}
              onChange={(e) => setBekrafta(e.target.value)}
              className={INPUT_CLS}
              disabled={laddar}
              required
            />
            {bekrafta.length > 0 && !matchar && (
              <p className="text-xs text-red-400 mt-1">Lösenorden matchar inte</p>
            )}
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={!kanSpara}
              className="bg-[#2D7A4F] text-white text-sm font-medium px-8 py-3.5 rounded-xl hover:bg-[#225f3d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {laddar ? "Sparar..." : "Byt lösenord"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FaktaRad({ label, varde }: { label: string; varde: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold pt-0.5">
        {label}
      </span>
      <span className="text-[#1a1a1a] text-right">{varde}</span>
    </div>
  );
}

// ─── Huvud-komponent ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const { session, laddar: laddarSession } = useSession();
  const [bokningar, setBokningar] = useState<Bokning[]>([]);
  const [laddarBokningar, setLaddarBokningar] = useState(true);
  const [aktivFlik, setAktivFlik] = useState<Flik>("bokningar");
  const router = useRouter();

  useEffect(() => {
    if (laddarSession) return;
    if (!session) {
      router.push("/logga-in");
      return;
    }
    fetch("/api/bokningar")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setBokningar(Array.isArray(data) ? data : []);
        setLaddarBokningar(false);
      })
      .catch(() => setLaddarBokningar(false));
  }, [laddarSession, session, router]);

  if (laddarSession || !session || laddarBokningar) {
    return (
      <main className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D7A4F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Laddar dashboard...</p>
        </div>
      </main>
    );
  }

  const isAdmin = session?.roll === "admin";

  const flikar: { key: Flik; label: string }[] = [
    { key: "bokningar", label: "Mina bokningar" },
    ...(isAdmin
      ? ([
          { key: "allaBokningar", label: "Alla bokningar" },
          { key: "offerter", label: "Offertförfrågningar" },
          { key: "hyresvardsanmalningar", label: "Hyresvärdsanmälningar" },
          { key: "laggUppBostad", label: "Lägg upp bostad" },
          { key: "laggUppRum", label: "Lägg upp rum" },
        ] as { key: Flik; label: string }[])
      : []),
    { key: "konto", label: "Mitt konto" },
  ];

  return (
    <main className="min-h-screen bg-[#F8F7F4]">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
          <h1 className="text-3xl font-bold text-[#1a1a1a]">Min dashboard</h1>
          {session && (
            <span className="text-sm text-gray-400 md:mt-1.5">
              Inloggad som{" "}
              <span className="text-[#1a1a1a] font-medium">{session.namn}</span>
              {isAdmin && (
                <span className="ml-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-[#2D7A4F] bg-[#e8f5ee] px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </span>
          )}
        </div>
        <p className="text-gray-400 mb-10">
          {isAdmin
            ? "Hantera bokningar, offerter och bostäder"
            : "Översikt över dina bokningar"}
        </p>

        {/* FLIKAR */}
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl border border-gray-100 w-fit mb-8 overflow-x-auto max-w-full">
          {flikar.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAktivFlik(key)}
              className={`text-sm px-4 md:px-5 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                aktivFlik === key
                  ? "bg-[#2D7A4F] text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {aktivFlik === "bokningar" && <MinaBokningar bokningar={bokningar} />}
        {aktivFlik === "konto" && session && <MittKonto session={session} />}
        {isAdmin && aktivFlik === "allaBokningar" && <AllaBokningar />}
        {isAdmin && aktivFlik === "offerter" && <Offertforfragningar />}
        {isAdmin && aktivFlik === "hyresvardsanmalningar" && <Hyresvardsanmalningar />}
        {isAdmin && aktivFlik === "laggUppBostad" && <LaggUppBostad />}
        {isAdmin && aktivFlik === "laggUppRum" && <LaggUppRum />}
      </div>
    </main>
  );
}
