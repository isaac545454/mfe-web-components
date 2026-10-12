/// <reference types="vite/client" />

declare module "characters/mount" {
  export function mount(element: HTMLElement): Promise<(() => void) | void> | (() => void) | void;
}

declare module "locations/mount" {
  export function mount(element: HTMLElement): Promise<(() => void) | void> | (() => void) | void;
}

declare module "episodes/mount" {
  export function mount(element: HTMLElement): Promise<(() => void) | void> | (() => void) | void;
}
