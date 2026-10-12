import { initTheme } from "@mfe/events";
import { createApp } from "vue";
import App from "./App.vue";
import { ensureNucleo } from "./nucleo";
import "@isaac545454/nucleo/styles.css";
import "./styles.css";

export async function mount(element: HTMLElement): Promise<() => void> {
  await ensureNucleo();
  initTheme();
  const app = createApp(App);
  app.mount(element);
  return () => app.unmount();
}
