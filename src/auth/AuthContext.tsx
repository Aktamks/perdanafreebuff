import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockUsers } from "../data/mockData";
import type { User } from "../types";

const SESSION_KEY = "laporbrosur_session";

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string, remember?: boolean) => AuthResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): User | null {
  let id: string | null = null;
  try {
    const raw =
      window.localStorage.getItem(SESSION_KEY) ??
      window.sessionStorage.getItem(SESSION_KEY);
    if (raw) id = JSON.parse(raw) as string;
  } catch {
    return null;
  }
  return mockUsers.find((u) => u.id === id) ?? null;
}

function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readSession());

  const login = useCallback(
    (email: string, password: string, remember = true): AuthResult => {
      const found = mockUsers.find(
        (u) =>
          u.email.toLowerCase() === email.trim().toLowerCase() &&
          u.password === password,
      );
      if (!found) {
        return { ok: false, error: "Email atau password salah." };
      }
      clearSession();
      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(found.id));
      setUser(found);
      return { ok: true, user: found };
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
