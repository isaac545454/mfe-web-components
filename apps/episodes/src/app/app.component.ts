import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  signal,
  viewChild,
} from "@angular/core";
import { eventBus, toggleTheme, type ThemeMode } from "@mfe/events";
import { fetchByIds, fetchPage, idFromUrl, type Episode } from "../api";

@Component({
  selector: "episodes-root",
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="rm-heading rm-standalone">
      <h1>Episódios</h1>
      <n-button variant="outline" size="sm" type="button" (click)="switchTheme()">
        {{ theme() === "dark" ? "Tema claro" : "Tema escuro" }}
      </n-button>
    </header>

    @if (!focus()) {
      <div class="rm-toolbar">
        <n-input #queryInput placeholder="Buscar episódio" type="search"></n-input>
        <div class="rm-pager">
          <n-button
            variant="outline"
            size="sm"
            type="button"
            [disabled]="page() <= 1 || status() === 'loading'"
            (click)="previous()"
          >
            Anterior
          </n-button>
          <n-badge variant="secondary">{{ page() }} / {{ pages() }}</n-badge>
          <n-button
            variant="outline"
            size="sm"
            type="button"
            [disabled]="page() >= pages() || status() === 'loading'"
            (click)="next()"
          >
            Próxima
          </n-button>
        </div>
      </div>
    }

    @if (focus(); as current) {
      <n-alert>
        <span slot="title">Episódios de {{ current.name }}</span>
        {{ episodes().length }} episódios ligados ao personagem escolhido no React.
        <n-button variant="link" size="sm" type="button" (click)="back()">Voltar à lista</n-button>
      </n-alert>
    }

    @if (status() === "loading") {
      <div class="rm-cards">
        @for (item of skeletons; track item) {
          <n-skeleton class="rm-block"></n-skeleton>
        }
      </div>
    } @else if (status() === "error") {
      <n-alert variant="destructive">
        <span slot="title">Não foi possível carregar</span>
        A API do Rick and Morty não respondeu.
      </n-alert>
    } @else if (episodes().length === 0) {
      <n-alert>
        <span slot="title">Nenhum episódio</span>
        Tente outro nome.
      </n-alert>
    } @else {
      <n-scroll-area class="rm-list">
        <div class="rm-cards">
          @for (episode of episodes(); track episode.id) {
            <n-card
              class="rm-pick"
              role="button"
              [class.rm-selected]="episode.id === selectedId()"
              (click)="choose(episode)"
            >
              <n-card-header>
                <n-card-title>{{ episode.name }}</n-card-title>
                <n-card-description>{{ episode.air_date }}</n-card-description>
              </n-card-header>
              <n-card-content>
                <div class="rm-meta">
                  <n-badge>{{ episode.episode }}</n-badge>
                  <n-badge variant="outline">{{ episode.characters.length }} personagens</n-badge>
                </div>
              </n-card-content>
            </n-card>
          }
        </div>
      </n-scroll-area>
    }

    @if (!embedded) {
      <p class="rm-muted">Remote Angular · porta 4103</p>
    }
  `,
})
export class AppComponent {
  readonly embedded = document.documentElement.dataset["shell"] === "true";
  readonly skeletons = [1, 2, 3, 4];
  readonly theme = signal<ThemeMode>(document.documentElement.classList.contains("dark") ? "dark" : "light");
  readonly query = signal("");
  readonly page = signal(1);
  readonly pages = signal(1);
  readonly episodes = signal<Episode[]>([]);
  readonly status = signal<"loading" | "ready" | "error">("loading");
  readonly selectedId = signal<number | null>(null);
  readonly focus = signal<{ name: string; episodeIds: number[] } | null>(null);

  private readonly queryInput = viewChild<ElementRef<HTMLElement>>("queryInput");
  private readonly stops: Array<() => void> = [];
  private timer = 0;
  private request = 0;

  constructor() {
    afterNextRender(() => {
      const element = this.queryInput()?.nativeElement;
      if (!element) return;
      const onInput = (event: Event) => {
        const value = (event as CustomEvent<string>).detail ?? "";
        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
          this.query.set(value.trim());
          this.page.set(1);
          void this.loadPage();
        }, 300);
      };
      element.addEventListener("n-input", onInput);
      this.stops.push(() => element.removeEventListener("n-input", onInput));
    });

    this.stops.push(
      eventBus.sub("theme:changed", ({ mode }) => this.theme.set(mode)),
      eventBus.sub("character:selected", (payload) => {
        this.selectedId.set(null);
        this.focus.set({ name: payload.name, episodeIds: payload.episodeIds });
        void this.loadFocused(payload.episodeIds);
      }),
      eventBus.sub("selection:cleared", () => {
        this.selectedId.set(null);
        this.focus.set(null);
        this.query.set("");
        this.page.set(1);
        const input = this.queryInput()?.nativeElement as (HTMLElement & { value?: string }) | undefined;
        if (input) input.value = "";
        void this.loadPage();
      }),
    );

    void this.loadPage();
  }

  switchTheme(): void {
    this.theme.set(toggleTheme());
  }

  previous(): void {
    this.page.update((current) => Math.max(1, current - 1));
    void this.loadPage();
  }

  next(): void {
    this.page.update((current) => current + 1);
    void this.loadPage();
  }

  back(): void {
    this.focus.set(null);
    void this.loadPage();
  }

  choose(episode: Episode): void {
    this.selectedId.set(episode.id);
    eventBus.pub("episode:selected", {
      id: episode.id,
      name: episode.name,
      code: episode.episode,
      airDate: episode.air_date,
      characterIds: episode.characters.map(idFromUrl).filter((id): id is number => id !== null),
    });
  }

  private async loadPage(): Promise<void> {
    const request = ++this.request;
    this.status.set("loading");
    try {
      const data = await fetchPage<Episode>("episode", this.page(), this.query());
      if (request !== this.request || this.focus()) return;
      this.episodes.set(data.results);
      this.pages.set(Math.max(data.info.pages, 1));
      this.status.set("ready");
    } catch {
      if (request === this.request) this.status.set("error");
    }
  }

  private async loadFocused(ids: number[]): Promise<void> {
    const request = ++this.request;
    this.status.set("loading");
    try {
      const results = await fetchByIds<Episode>("episode", ids);
      if (request !== this.request) return;
      this.episodes.set(results);
      this.status.set("ready");
    } catch {
      if (request === this.request) this.status.set("error");
    }
  }
}
