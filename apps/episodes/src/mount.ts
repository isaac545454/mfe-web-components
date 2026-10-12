import { createComponent, provideZonelessChangeDetection } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import { initTheme } from "@mfe/events";
import { AppComponent } from "./app/app.component";
import { ensureNucleo } from "./nucleo";
import "@isaac545454/nucleo/styles.css";
import "./styles.css";

export async function mount(element: HTMLElement): Promise<() => void> {
  await ensureNucleo();
  initTheme();
  const appRef = await createApplication({
    providers: [provideZonelessChangeDetection()],
  });
  element.classList.add("rm-page");
  const ref = createComponent(AppComponent, {
    environmentInjector: appRef.injector,
    hostElement: element,
  });
  appRef.attachView(ref.hostView);
  ref.changeDetectorRef.detectChanges();
  return () => {
    ref.destroy();
    appRef.destroy();
  };
}
