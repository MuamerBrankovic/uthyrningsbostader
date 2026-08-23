// ═══════════════════════════════════════════════════════════════════════════
// "FÖRSÖK IGEN"-KNAPPEN I FELSIDORNA
//
// Next 16.2 skickar in unstable_retry() till app/error.tsx och
// app/global-error.tsx. Den ligger under Experimental Features i
// dokumentationen, inte bland de stabila API:erna — byter den namn vid en
// uppgradering blir proppen undefined. En knapp som anropar den rakt av
// (onClick={() => unstable_retry()}) skulle då kasta TypeError inne på just
// den sida som ska rädda situationen. Det är det sämsta tänkbara stället att
// få ett fel på, och det skulle dessutom bara märkas i produktion.
//
// Kedjan nedan gör att knappen alltid gör något vettigt:
//   1. unstable_retry() — hämtar om innehållet från servern (förstahandsval)
//   2. reset()          — äldre namnet, återupprättar bara felgränsen
//   3. omladdning       — sista utvägen om båda propparna försvinner
// ═══════════════════════════════════════════════════════════════════════════

export function skapaForsokIgen(
  unstable_retry?: () => void,
  reset?: () => void
): () => void {
  return () => {
    const aterhamta = unstable_retry ?? reset;
    if (aterhamta) {
      aterhamta();
      return;
    }
    window.location.reload();
  };
}
