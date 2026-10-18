import { Component, input } from '@angular/core';

/** Marca de la app: monograma con borde degradado y resplandor tenue. */
@Component({
  selector: 'app-brand-mark',
  host: { class: 'inline-flex items-center gap-2' },
  template: `
    <span
      aria-hidden="true"
      class="edge-gradient grid size-9 place-items-center rounded-xl bg-carbon font-display text-sm font-bold text-neon-cyan shadow-neon-cyan"
    >
      Y
    </span>
    @if (showWordmark()) {
      <span class="font-display text-sm font-semibold tracking-[0.3em] text-ink uppercase">
        Yaph
      </span>
    }
  `,
})
export class BrandMark {
  readonly showWordmark = input(false);
}
