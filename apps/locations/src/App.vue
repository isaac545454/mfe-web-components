<script setup lang="ts">
import { eventBus, toggleTheme, type ThemeMode } from "@mfe/events";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { fetchByIds, fetchPage, idFromUrl, type Location } from "./api";

const embedded = document.documentElement.dataset.shell === "true";
const theme = ref<ThemeMode>(document.documentElement.classList.contains("dark") ? "dark" : "light");
const draft = ref("");
const query = ref("");
const page = ref(1);
const pages = ref(1);
const places = ref<Location[]>([]);
const status = ref<"loading" | "ready" | "error">("loading");
const selectedId = ref<number | null>(null);
const relatedId = ref<number | null>(null);
const pinned = ref<Location | null>(null);
const pinnedBecause = ref("");
const unknownCharacter = ref("");
const resetKey = ref(0);
const queryRef = ref<HTMLElement | null>(null);

let timer = 0;
const stops: Array<() => void> = [];

const themeLabel = computed(() => (theme.value === "dark" ? "Tema claro" : "Tema escuro"));

function cardClass(id: number): string {
  if (id === selectedId.value) return "rm-pick rm-selected";
  if (id === relatedId.value) return "rm-pick rm-related";
  return "rm-pick";
}

async function loadPage() {
  status.value = "loading";
  try {
    const data = await fetchPage<Location>("location", page.value, query.value);
    places.value = data.results;
    pages.value = Math.max(data.info.pages, 1);
    status.value = "ready";
  } catch {
    status.value = "error";
  }
}

async function pinLocation(locationId: number | null, characterName: string) {
  relatedId.value = locationId;
  pinnedBecause.value = characterName;
  unknownCharacter.value = "";
  pinned.value = null;
  if (locationId == null) {
    unknownCharacter.value = characterName;
    return;
  }
  if (places.value.some((place) => place.id === locationId)) return;
  try {
    const [location] = await fetchByIds<Location>("location", [locationId]);
    if (relatedId.value === locationId) pinned.value = location ?? null;
  } catch {
    status.value = "error";
  }
}

function choose(place: Location) {
  selectedId.value = place.id;
  relatedId.value = null;
  pinned.value = null;
  unknownCharacter.value = "";
  eventBus.pub("location:selected", {
    id: place.id,
    name: place.name,
    type: place.type,
    dimension: place.dimension,
    residentIds: place.residents.map(idFromUrl).filter((id): id is number => id !== null),
  });
}

function onDraft(value: string) {
  draft.value = value;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    page.value = 1;
    query.value = value.trim();
  }, 300);
}

watch([page, query], () => {
  void loadPage();
}, { immediate: true });

onMounted(() => {
  const element = queryRef.value;
  if (element) {
    const onInput = (event: Event) => onDraft((event as CustomEvent<string>).detail ?? "");
    element.addEventListener("n-input", onInput);
    stops.push(() => element.removeEventListener("n-input", onInput));
  }

  stops.push(
    eventBus.sub("theme:changed", ({ mode }) => {
      theme.value = mode;
    }),
    eventBus.sub("character:selected", (payload) => {
      selectedId.value = null;
      void pinLocation(payload.locationId, payload.name);
    }),
    eventBus.sub("selection:cleared", () => {
      selectedId.value = null;
      relatedId.value = null;
      pinned.value = null;
      pinnedBecause.value = "";
      unknownCharacter.value = "";
      draft.value = "";
      query.value = "";
      resetKey.value += 1;
      const input = queryRef.value as (HTMLElement & { value?: string }) | null;
      if (input) input.value = "";
    }),
  );
});

onUnmounted(() => {
  window.clearTimeout(timer);
  for (const stop of stops) stop();
});
</script>

<template>
  <div class="rm-page">
    <header class="rm-heading rm-standalone">
      <h1>Locais</h1>
      <n-button variant="outline" size="sm" type="button" @click="theme = toggleTheme()">
        {{ themeLabel }}
      </n-button>
    </header>

    <div class="rm-toolbar">
      <n-input :key="resetKey" ref="queryRef" placeholder="Buscar local" type="search" />
      <div class="rm-pager">
        <n-button
          variant="outline"
          size="sm"
          type="button"
          :disabled="page <= 1 || status === 'loading'"
          @click="page = Math.max(1, page - 1)"
        >
          Anterior
        </n-button>
        <n-badge variant="secondary">{{ page }} / {{ pages }}</n-badge>
        <n-button
          variant="outline"
          size="sm"
          type="button"
          :disabled="page >= pages || status === 'loading'"
          @click="page = page + 1"
        >
          Próxima
        </n-button>
      </div>
    </div>

    <n-alert v-if="unknownCharacter">
      <span slot="title">Local desconhecido</span>
      {{ unknownCharacter }} não tem um local na API.
    </n-alert>

    <n-alert v-else-if="pinnedBecause && (pinned || relatedId)">
      <span slot="title">Local de {{ pinnedBecause }}</span>
      O card marcado veio da escolha no app de personagens.
    </n-alert>

    <n-card v-if="pinned" :class="cardClass(pinned.id)" role="button" @click="choose(pinned)">
      <n-card-header>
        <n-card-title>{{ pinned.name }}</n-card-title>
        <n-card-description>{{ pinned.dimension || "Dimensão desconhecida" }}</n-card-description>
      </n-card-header>
      <n-card-content>
        <div class="rm-meta">
          <n-badge variant="secondary">{{ pinned.type || "Sem tipo" }}</n-badge>
          <n-badge variant="outline">{{ pinned.residents.length }} moradores</n-badge>
        </div>
      </n-card-content>
    </n-card>

    <div v-if="status === 'loading'" class="rm-cards">
      <n-skeleton v-for="item in 4" :key="item" class="rm-block" />
    </div>

    <n-alert v-else-if="status === 'error'" variant="destructive">
      <span slot="title">Não foi possível carregar</span>
      A API do Rick and Morty não respondeu.
    </n-alert>

    <n-alert v-else-if="places.length === 0">
      <span slot="title">Nenhum local</span>
      Tente outro nome.
    </n-alert>

    <n-scroll-area v-else class="rm-list">
      <div class="rm-cards">
        <n-card v-for="place in places" :key="place.id" :class="cardClass(place.id)" role="button" @click="choose(place)">
          <n-card-header>
            <n-card-title>{{ place.name }}</n-card-title>
            <n-card-description>{{ place.dimension || "Dimensão desconhecida" }}</n-card-description>
          </n-card-header>
          <n-card-content>
            <div class="rm-meta">
              <n-badge variant="secondary">{{ place.type || "Sem tipo" }}</n-badge>
              <n-badge variant="outline">{{ place.residents.length }} moradores</n-badge>
            </div>
          </n-card-content>
        </n-card>
      </div>
    </n-scroll-area>

    <p v-if="!embedded" class="rm-muted">Remote Vue · porta 4102</p>
  </div>
</template>
