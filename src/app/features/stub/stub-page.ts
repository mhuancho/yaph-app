import { Component, input } from '@angular/core';
import { Icon, IconName } from '../../ui/icon';

/**
 * Placeholder de las secciones aún no implementadas.
 *
 * Existe para que la navegación sea real (rutas, estado activo, lazy loading)
 * en lugar de enlaces muertos. Recibe su contenido desde `data` de la ruta.
 */
@Component({
  selector: 'app-stub-page',
  imports: [Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="grid h-full place-items-center px-6 pt-20 pb-28 md:pt-8 md:pb-8">
      <div
        class="glass edge-gradient hud-grid w-full max-w-md rounded-glass border border-white/10 p-8 text-center shadow-hud"
      >
        <span
          class="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan"
        >
          <app-icon [name]="icon()" class="size-6" />
        </span>

        <h1 class="font-display text-2xl font-semibold tracking-tight">{{ heading() }}</h1>
        <p class="mt-3 text-sm leading-relaxed text-ink-muted">{{ blurb() }}</p>

        <p
          class="metric mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[0.625rem] tracking-[0.2em] text-ink-faint uppercase"
        >
          <span class="size-1.5 animate-breathe rounded-full bg-neon-amber"></span>
          En construcción
        </p>
      </div>
    </div>
  `,
})
export class StubPage {
  readonly heading = input.required<string>();
  readonly blurb = input.required<string>();
  readonly icon = input.required<IconName>();
}
