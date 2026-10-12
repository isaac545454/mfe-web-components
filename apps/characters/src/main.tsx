import { mount } from "./mount";

const root = document.querySelector<HTMLElement>("#app");
if (root) void mount(root);
