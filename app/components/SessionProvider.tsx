"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Session = {
  userId: string;
  email: string;
  namn: string;
  roll: string;
} | null;

type SessionContextValue = {
  session: Session;
  laddar: boolean;
  /** Sätt sessionen direkt (t.ex. null vid utloggning) utan server-anrop */
  setSession: (s: Session) => void;
  /** Hämta om sessionen från servern — anropas efter inloggning/registrering */
  uppdateraSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// Sessionen ägs av EN delad provider i root-layouten. Komponenter som ändrar
// inloggningsläget (logga-in, registrera, logga-ut) uppdaterar den här —
// aldrig egna lokala kopior. Layouten remountas inte vid klientnavigering
// och router.refresh() rör inte klient-state, så lokala kopior blir stale.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [laddar, setLaddar] = useState(true);

  const uppdateraSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) throw new Error("session-fel");
      setSession(await res.json());
    } catch {
      setSession(null);
    } finally {
      setLaddar(false);
    }
  }, []);

  useEffect(() => {
    uppdateraSession();

    // Bakåt-navigering från extern sida kan återställa sidan ur bfcache
    // utan att effekter körs om — hämta då sessionen på nytt
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) uppdateraSession();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [uppdateraSession]);

  return (
    <SessionContext.Provider
      value={{ session, laddar, setSession, uppdateraSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession måste användas inom <SessionProvider>");
  }
  return ctx;
}
