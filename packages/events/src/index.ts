import { createEventBus, type EventBus } from "@isaac545454/frontend-events";

export type ThemeMode = "light" | "dark";

export type CharacterSelected = {
  id: number;
  name: string;
  image: string;
  status: string;
  species: string;
  locationId: number | null;
  locationName: string;
  episodeIds: number[];
};

export type LocationSelected = {
  id: number;
  name: string;
  type: string;
  dimension: string;
  residentIds: number[];
};

export type EpisodeSelected = {
  id: number;
  name: string;
  code: string;
  airDate: string;
  characterIds: number[];
};

export type AppEvents = {
  "character:selected": CharacterSelected;
  "location:selected": LocationSelected;
  "episode:selected": EpisodeSelected;
  "selection:cleared": void;
  "theme:changed": { mode: ThemeMode };
};

const BUS_KEY = "__mfe_event_bus__";

function createSharedBus(): EventBus<AppEvents> {
  const scope = globalThis as typeof globalThis & {
    [BUS_KEY]?: EventBus<AppEvents>;
  };

  if (!scope[BUS_KEY]) {
    scope[BUS_KEY] = createEventBus<AppEvents>();
  }

  return scope[BUS_KEY];
}

/** Uma instância no window, mesmo quando cada remote empacota a lib. */
export const eventBus = createSharedBus();

const THEME_KEY = "mfe-theme";

export function readTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem(THEME_KEY, mode);
}

export function initTheme(): ThemeMode {
  const mode = readTheme();
  applyTheme(mode);
  return mode;
}

export function toggleTheme(): ThemeMode {
  const mode: ThemeMode = document.documentElement.classList.contains("dark") ? "light" : "dark";
  applyTheme(mode);
  eventBus.pub("theme:changed", { mode });
  return mode;
}
