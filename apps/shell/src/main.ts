import "@isaac545454/nucleo/styles.css";
import "./styles.css";
import { eventBus, initTheme, toggleTheme, type ThemeMode } from "@mfe/events";
import { ensureNucleo } from "./nucleo";

type RemoteModule = {
  mount: (element: HTMLElement) => Promise<(() => void) | void> | (() => void) | void;
};

const remotes: Array<{
  slot: string;
  title: string;
  detail: string;
  framework: string;
  port: number;
  load: () => Promise<RemoteModule>;
}> = [
  {
    slot: "characters",
    title: "Personagens",
    detail: "Lista e busca",
    framework: "React",
    port: 4101,
    load: () => import("characters/mount"),
  },
  {
    slot: "locations",
    title: "Locais",
    detail: "Planetas e dimensões",
    framework: "Vue",
    port: 4102,
    load: () => import("locations/mount"),
  },
  {
    slot: "episodes",
    title: "Episódios",
    detail: "Temporadas da série",
    framework: "Angular",
    port: 4103,
    load: () => import("episodes/mount"),
  },
];

const unmounts: Array<() => void> = [];

function themeLabel(mode: ThemeMode): string {
  return mode === "dark" ? "Tema claro" : "Tema escuro";
}

function pushLog(text: string): void {
  const log = document.querySelector("#log");
  if (!log) return;
  const badge = document.createElement("n-badge");
  badge.setAttribute("variant", "secondary");
  const time = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  badge.textContent = `${time} · ${text}`;
  log.prepend(badge);
  while (log.childElementCount > 6) log.lastElementChild?.remove();
}

function showFailure(slot: HTMLElement, title: string, message: string): void {
  slot.replaceChildren();
  const alert = document.createElement("n-alert");
  alert.setAttribute("variant", "destructive");
  const heading = document.createElement("span");
  heading.slot = "title";
  heading.textContent = title;
  alert.append(heading, document.createTextNode(message));
  slot.append(alert);
}

function render(mode: ThemeMode): void {
  const app = document.querySelector("#app");
  if (!app) return;

  const panels = remotes
    .map(
      (remote) => `
        <section class="panel">
          <header>
            <div>
              <h2>${remote.title}</h2>
              <p>${remote.detail}</p>
            </div>
            <n-badge variant="outline">${remote.framework}</n-badge>
          </header>
          <div class="slot" id="slot-${remote.slot}">
            <div class="pending">
              <n-spinner label="Carregando ${remote.framework}"></n-spinner>
            </div>
          </div>
        </section>`,
    )
    .join("");

  app.innerHTML = `
    <div class="shell">
      <header class="top">
        <div>
          <p class="eyebrow">Module Federation · Vite</p>
          <h1>Shell</h1>
          <p class="lede">Três apps consomem a API do Rick and Morty. Escolher um item publica um evento e os outros reagem.</p>
        </div>
        <div class="actions">
          <n-button id="theme" variant="outline" size="sm" type="button">${themeLabel(mode)}</n-button>
          <n-button id="clear" variant="ghost" size="sm" type="button">Limpar seleção</n-button>
        </div>
      </header>
      <nav class="links" id="links"></nav>
      <div class="log" id="log"></div>
      <n-separator></n-separator>
      <div class="grid">${panels}</div>
      <footer>
        Dados de <a href="https://rickandmortyapi.com" target="_blank" rel="noreferrer">rickandmortyapi.com</a>
      </footer>
    </div>`;

  const links = document.querySelector("#links");
  for (const remote of remotes) {
    const anchor = document.createElement("a");
    anchor.href = `http://localhost:${remote.port}`;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = `${remote.framework} :${remote.port}`;
    links?.append(anchor);
  }

  document.querySelector("#theme")?.addEventListener("click", () => {
    const next = toggleTheme();
    const button = document.querySelector("#theme");
    if (button) button.textContent = themeLabel(next);
  });

  document.querySelector("#clear")?.addEventListener("click", () => {
    eventBus.pub("selection:cleared");
  });
}

function listen(): void {
  eventBus.sub("character:selected", ({ name }) => pushLog(`personagem ${name}`));
  eventBus.sub("location:selected", ({ name }) => pushLog(`local ${name}`));
  eventBus.sub("episode:selected", ({ code, name }) => pushLog(`episódio ${code} ${name}`));
  eventBus.sub("selection:cleared", () => pushLog("seleção limpa"));
  eventBus.sub("theme:changed", ({ mode }) => {
    const button = document.querySelector("#theme");
    if (button) button.textContent = themeLabel(mode);
    pushLog(mode === "dark" ? "tema escuro" : "tema claro");
  });
}

async function loadRemote(remote: (typeof remotes)[number]): Promise<void> {
  const slot = document.querySelector<HTMLElement>(`#slot-${remote.slot}`);
  if (!slot) return;

  try {
    const module = await remote.load();
    const unmount = await module.mount(slot);
    if (typeof unmount === "function") unmounts.push(unmount);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar o remote.";
    showFailure(
      slot,
      `${remote.title} indisponível`,
      `O app ${remote.framework} precisa estar em http://localhost:${remote.port}. ${message}`,
    );
  }
}

async function main(): Promise<void> {
  const mode = initTheme();
  await ensureNucleo();
  render(mode);
  listen();
  await Promise.all(remotes.map((remote) => loadRemote(remote)));
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    for (const unmount of unmounts) unmount();
  });
}

void main();
