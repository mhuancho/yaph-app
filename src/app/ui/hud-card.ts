import { Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

/**
 * Contenedor con estética HUD para el panel derecho.
 *
 * Usa `glass` (con `backdrop-filter`) porque vive sobre el fondo estático de la
 * página. Las capas que se solapan con el video usan `glass-flat`.
 */
@Component({
  selector: 'app-hud-card',
  imports: [Icon],
  host: {
    class:
      'glass edge-gradient edge-live hud-grid group relative block overflow-hidden ' +
      'rounded-glass p-4 shadow-hud transition-[transform,box-shadow] duration-300 ' +
      'hover:-translate-y-0.5',
  },
  template: `
    <!-- Línea de barrido: pura decoración, por eso va detrás y sin eventos. -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan bg-[linear-gradient(90deg,transparent,var(--color-neon-cyan),transparent)] opacity-0 group-hover:opacity-70"
    ></span>

    <header class="mb-3 flex items-center gap-2">
      <app-icon [name]="icon()" class="size-4 text-neon-cyan" />
      <h2 class="metric text-[0.7rem] font-semibold tracking-[0.18em] text-ink-muted uppercase">
        {{ heading() }}
      </h2>
      @if (tag(); as tagText) {
        <span
          class="metric ml-auto rounded-full border border-white/10 px-2 py-[2px] text-[0.625rem] text-ink-faint"
        >
          {{ tagText }}
        </span>
      }
    </header>

    <ng-content />
  `,
})
export class HudCard {
  readonly heading = input.required<string>();
  readonly icon = input.required<IconName>();
  /** Etiqueta corta a la derecha del título (estado, región, latencia...). */
  readonly tag = input<string | null>(null);
}
