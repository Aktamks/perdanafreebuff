import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { teams as initialTeams } from "../data/mockData";
import { getCityCoords } from "../data/coordinates";
import type { Team, TeamInput } from "../types";

interface TeamsContextValue {
  teams: Team[];
  addTeam: (input: TeamInput) => void;
  updateTeam: (id: string, input: Partial<TeamInput>) => void;
  toggleTeamStatus: (id: string) => void;
  getTeam: (id: string | undefined) => Team | undefined;
}

const TeamsContext = createContext<TeamsContextValue | null>(null);

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  const addTeam = useCallback((input: TeamInput) => {
    // Koordinat diturunkan dari kota terpilih (form belum punya input koordinat),
    // agar tim baru langsung tampil di peta tanpa source of truth kedua.
    const { lat, lng } = getCityCoords(input.city);
    const team: Team = {
      ...input,
      id: `t-${Date.now()}`,
      latitude: lat,
      longitude: lng,
      // currentJobId dikelola modul Pekerjaan, bukan lewat form tim.
      currentJobId: null,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setTeams((prev) => [team, ...prev]);
  }, []);

  const updateTeam = useCallback(
    (id: string, input: Partial<TeamInput>) => {
      setTeams((prev) =>
        prev.map((team) => (team.id === id ? { ...team, ...input } : team)),
      );
    },
    [],
  );

  const toggleTeamStatus = useCallback((id: string) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === id
          ? {
              ...team,
              status: team.status === "active" ? "inactive" : "active",
            }
          : team,
      ),
    );
  }, []);

  const getTeam = useCallback(
    (id: string | undefined) => teams.find((team) => team.id === id),
    [teams],
  );

  const value = useMemo(
    () => ({ teams, addTeam, updateTeam, toggleTeamStatus, getTeam }),
    [teams, addTeam, updateTeam, toggleTeamStatus, getTeam],
  );

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
}

export function useTeams(): TeamsContextValue {
  const ctx = useContext(TeamsContext);
  if (!ctx) throw new Error("useTeams harus dipakai di dalam TeamsProvider");
  return ctx;
}
