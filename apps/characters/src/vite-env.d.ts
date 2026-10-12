/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from "react";

type El<T = object> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & T;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "n-button": El<{
        variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
        size?: "default" | "sm" | "lg" | "icon";
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
      }>;
      "n-input": El<{ value?: string; placeholder?: string; type?: string }>;
      "n-card": El;
      "n-card-header": El;
      "n-card-title": El;
      "n-card-description": El;
      "n-card-content": El;
      "n-badge": El<{ variant?: "default" | "secondary" | "destructive" | "outline" }>;
      "n-avatar": El<{ src?: string; alt?: string; fallback?: string }>;
      "n-skeleton": El;
      "n-spinner": El<{ label?: string; size?: "sm" | "default" | "lg" }>;
      "n-alert": El<{ variant?: "default" | "destructive" }>;
      "n-scroll-area": El;
    }
  }
}
