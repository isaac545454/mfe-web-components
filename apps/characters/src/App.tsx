import { eventBus, toggleTheme, type ThemeMode } from "@mfe/events";
import { useEffect, useRef, useState } from "react";
import { fetchByIds, fetchPage, idFromUrl, type Character } from "./api";

type Foreign =
  | {
      kind: "location";
      id: number;
      name: string;
      total: number;
      ids: number[];
    }
  | {
      kind: "episode";
      id: number;
      name: string;
      code: string;
      total: number;
      ids: number[];
    };

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statusLabel(status: string): string {
  if (status === "Alive") return "Vivo";
  if (status === "Dead") return "Morto";
  return "Desconhecido";
}

function statusVariant(status: string): "default" | "destructive" | "outline" {
  if (status === "Alive") return "default";
  if (status === "Dead") return "destructive";
  return "outline";
}

function SearchInput({
  placeholder,
  onValue,
  resetKey,
}: {
  placeholder: string;
  onValue: (value: string) => void;
  resetKey: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const onValueRef = useRef(onValue);
  onValueRef.current = onValue;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onInput = (event: Event) => {
      onValueRef.current((event as CustomEvent<string>).detail ?? "");
    };
    element.addEventListener("n-input", onInput);
    return () => element.removeEventListener("n-input", onInput);
  }, []);

  useEffect(() => {
    const element = ref.current as (HTMLElement & { value?: string }) | null;
    if (element && resetKey > 0) element.value = "";
  }, [resetKey]);

  return <n-input ref={ref} placeholder={placeholder} type="search" />;
}

export function App() {
  const embedded = document.documentElement.dataset.shell === "true";
  const [theme, setTheme] = useState<ThemeMode>(
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [items, setItems] = useState<Character[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [foreign, setForeign] = useState<Foreign | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQuery(draft.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => eventBus.sub("theme:changed", ({ mode }) => setTheme(mode)), []);

  useEffect(() => {
    const stopLocation = eventBus.sub("location:selected", (payload) => {
      setSelectedId(null);
      setForeign({
        kind: "location",
        id: payload.id,
        name: payload.name,
        total: payload.residentIds.length,
        ids: payload.residentIds,
      });
    });
    const stopEpisode = eventBus.sub("episode:selected", (payload) => {
      setSelectedId(null);
      setForeign({
        kind: "episode",
        id: payload.id,
        name: payload.name,
        code: payload.code,
        total: payload.characterIds.length,
        ids: payload.characterIds,
      });
    });
    const stopClear = eventBus.sub("selection:cleared", () => {
      setSelectedId(null);
      setForeign(null);
      setDraft("");
      setQuery("");
      setResetKey((value) => value + 1);
    });
    return () => {
      stopLocation();
      stopEpisode();
      stopClear();
    };
  }, []);

  useEffect(() => {
    if (foreign) return;
    let cancelled = false;
    setStatus("loading");
    fetchPage<Character>("character", page, query)
      .then((data) => {
        if (cancelled) return;
        setItems(data.results);
        setPages(Math.max(data.info.pages, 1));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [page, query, foreign]);

  useEffect(() => {
    if (!foreign) return;
    let cancelled = false;
    setStatus("loading");
    fetchByIds<Character>("character", foreign.ids)
      .then((results) => {
        if (cancelled) return;
        setItems(results);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [foreign]);

  function choose(character: Character) {
    setSelectedId(character.id);
    eventBus.pub("character:selected", {
      id: character.id,
      name: character.name,
      image: character.image,
      status: character.status,
      species: character.species,
      locationId: idFromUrl(character.location.url),
      locationName: character.location.name,
      episodeIds: character.episode.map(idFromUrl).filter((id): id is number => id !== null),
    });
  }

  return (
    <div className="rm-page">
      <header className="rm-heading rm-standalone">
        <h1>Personagens</h1>
        <n-button variant="outline" size="sm" type="button" onClick={() => setTheme(toggleTheme())}>
          {theme === "dark" ? "Tema claro" : "Tema escuro"}
        </n-button>
      </header>

      <div className="rm-toolbar">
        <SearchInput placeholder="Buscar personagem" onValue={setDraft} resetKey={resetKey} />
        {!foreign && (
          <div className="rm-pager">
            <n-button
              variant="outline"
              size="sm"
              type="button"
              disabled={page <= 1 || status === "loading"}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </n-button>
            <n-badge variant="secondary">
              {page} / {Math.max(pages, 1)}
            </n-badge>
            <n-button
              variant="outline"
              size="sm"
              type="button"
              disabled={page >= pages || status === "loading"}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </n-button>
          </div>
        )}
      </div>

      {foreign && (
        <n-alert>
          <span slot="title">
            {foreign.kind === "location" ? `Moradores de ${foreign.name}` : `Elenco de ${foreign.code}`}
          </span>
          <span>
            {Math.min(foreign.total, 20)} de {foreign.total} personagens.{" "}
          </span>
          <n-button variant="link" size="sm" type="button" onClick={() => setForeign(null)}>
            Voltar à lista
          </n-button>
        </n-alert>
      )}

      {status === "loading" && (
        <div className="rm-cards">
          {Array.from({ length: 4 }, (_, index) => (
            <n-skeleton className="rm-block" key={index} />
          ))}
        </div>
      )}

      {status === "error" && (
        <n-alert variant="destructive">
          <span slot="title">Não foi possível carregar</span>
          A API do Rick and Morty não respondeu.
        </n-alert>
      )}

      {status === "ready" && items.length === 0 && (
        <n-alert>
          <span slot="title">Nenhum personagem</span>
          Tente outro nome.
        </n-alert>
      )}

      {status === "ready" && items.length > 0 && (
        <n-scroll-area className="rm-list">
          <div className="rm-cards">
            {items.map((character) => (
              <n-card
                key={character.id}
                className={character.id === selectedId ? "rm-pick rm-selected" : "rm-pick"}
                role="button"
                onClick={() => choose(character)}
              >
                <n-card-header>
                  <div className="rm-person">
                    <n-avatar src={character.image} alt={character.name} fallback={initials(character.name)} />
                    <div>
                      <n-card-title>{character.name}</n-card-title>
                      <p>{character.location.name}</p>
                    </div>
                  </div>
                </n-card-header>
                <n-card-content>
                  <div className="rm-meta">
                    <n-badge variant={statusVariant(character.status)}>{statusLabel(character.status)}</n-badge>
                    <n-badge variant="outline">{character.species}</n-badge>
                  </div>
                </n-card-content>
              </n-card>
            ))}
          </div>
        </n-scroll-area>
      )}

      {embedded ? null : <p className="rm-muted">Remote React · porta 4101</p>}
    </div>
  );
}
