import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clients as initialClients } from "../data/mockData";
import type { Client, ClientInput } from "../types";

interface ClientsContextValue {
  clients: Client[];
  addClient: (input: ClientInput) => void;
  updateClient: (id: string, input: Partial<ClientInput>) => void;
  toggleClientStatus: (id: string) => void;
  getClient: (id: string | undefined) => Client | undefined;
}

const ClientsContext = createContext<ClientsContextValue | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(initialClients);

  const addClient = useCallback((input: ClientInput) => {
    const client: Client = {
      ...input,
      id: `c-${Date.now()}`,
      // totalJobs legacy/derived — statistik dihitung dari relasi Job.clientId.
      totalJobs: 0,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [client, ...prev]);
  }, []);

  const updateClient = useCallback(
    (id: string, input: Partial<ClientInput>) => {
      setClients((prev) =>
        prev.map((client) => (client.id === id ? { ...client, ...input } : client)),
      );
    },
    [],
  );

  const toggleClientStatus = useCallback((id: string) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === id
          ? {
              ...client,
              status: client.status === "active" ? "inactive" : "active",
            }
          : client,
      ),
    );
  }, []);

  const getClient = useCallback(
    (id: string | undefined) => clients.find((client) => client.id === id),
    [clients],
  );

  const value = useMemo(
    () => ({ clients, addClient, updateClient, toggleClientStatus, getClient }),
    [clients, addClient, updateClient, toggleClientStatus, getClient],
  );

  return (
    <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
  );
}

export function useClients(): ClientsContextValue {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients harus dipakai di dalam ClientsProvider");
  return ctx;
}
