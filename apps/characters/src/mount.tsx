import { initTheme } from "@mfe/events";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ensureNucleo } from "./nucleo";
import "@isaac545454/nucleo/styles.css";
import "./styles.css";

export async function mount(element: HTMLElement): Promise<() => void> {
  await ensureNucleo();
  initTheme();
  const root = createRoot(element);
  root.render(<App />);
  return () => root.unmount();
}
