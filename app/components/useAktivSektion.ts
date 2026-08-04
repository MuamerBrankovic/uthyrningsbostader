"use client";
import { useEffect, useState } from "react";

// ─── Scrollspion för menylänkar som pekar på en sektion ──────────────────────
//
// VAD DEN GÖR
// Håller koll på vilka <section id="..."> som just nu befinner sig i den övre
// delen av fönstret och returnerar id:t för den man tittar på. Returnerar null
// när ingen av de bevakade sektionerna är i vy — då markeras ingen länk.
//
// VAD DU SKICKAR IN
//   sektionsIdn — id:na som ska bevakas, t.ex. ["for-foretag"]
//   aktiverad   — false stänger av bevakningen helt. Används på alla sidor
//                 utom startsidan, där sektionerna inte ens finns.
//
// VARFÖR INTERSECTIONOBSERVER
// Ingen scroll-lyssnare: webbläsaren gör jobbet och hör av sig bara när en
// sektion faktiskt korsar gränsen. Det kostar ingenting under scrollning.

// Bevakningsbandet — en vågrät remsa mellan 20 % och 30 % av fönsterhöjden
// (-20 % uppifrån, -70 % nerifrån). En sektion blir alltså aktiv när den når
// den övre delen av skärmen, inte först när den fyller hela fönstret.
// Vill du att markeringen ska slå till senare: höj första talet.
const BEVAKNINGSBAND = "-20% 0px -70% 0px";

export function useAktivSektion(
  sektionsIdn: string[],
  aktiverad: boolean
): string | null {
  const [aktiv, setAktiv] = useState<string | null>(null);

  // En array får ny identitet vid varje rendering. Vi jämför därför på
  // innehållet i stället, så att observern inte byggs om i onödan.
  const nyckel = sektionsIdn.join(",");

  useEffect(() => {
    if (!aktiverad) return;

    const idn = nyckel ? nyckel.split(",") : [];
    const element = idn
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (element.length === 0) return;

    const synliga = new Set<string>();

    const observator = new IntersectionObserver(
      (poster) => {
        for (const post of poster) {
          if (post.isIntersecting) synliga.add(post.target.id);
          else synliga.delete(post.target.id);
        }
        // Skulle två sektioner råka vara i bandet samtidigt vinner den som
        // står först i MENY-listan i Navbar.tsx.
        // (Med ett så smalt band händer det i praktiken inte.)
        setAktiv(idn.find((id) => synliga.has(id)) ?? null);
      },
      { rootMargin: BEVAKNINGSBAND, threshold: 0 }
    );

    element.forEach((el) => observator.observe(el));

    // Städa upp när menyn försvinner eller sidan byts — annars ligger
    // observern kvar och läcker minne.
    return () => observator.disconnect();
  }, [nyckel, aktiverad]);

  // Är bevakningen avstängd (= vi är inte på startsidan) svarar vi alltid null,
  // så att ingen gammal markering kan ligga kvar från förra besöket.
  return aktiverad ? aktiv : null;
}
