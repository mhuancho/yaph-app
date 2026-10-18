import { Component, computed, input } from '@angular/core';
import { BadgeTier } from '../core/models/feed';
import { Icon } from './icon';

interface BadgeStyle {
  readonly label: string;
  readonly classes: string;
}

/**
 * Insignia holográfica del creador.
 *
 * Las clases se escriben completas por rama (no concatenadas) porque Tailwind
 * v4 detecta utilidades escaneando el código fuente como texto: una clase
 * construida en runtime nunca llega al CSS generado.
 */
const STYLES: Readonly<Record<BadgeTier, BadgeStyle>> = {
  partner: {
    label: 'Partner',
    classes: 'text-neon-cyan border-neon-cyan/45 bg-neon-cyan/10 shadow-neon-cyan',
  },
  creator: {
    label: 'Creador',
    classes: 'text-neon-violet border-neon-violet/45 bg-neon-violet/10',
  },
  pioneer: {
    label: 'Pionero',
    classes: 'text-neon-amber border-neon-amber/45 bg-neon-amber/10',
  },
  live: {
    label: 'En vivo',
    classes: 'text-neon-magenta border-neon-magenta/50 bg-neon-magenta/12 shadow-neon-magenta',
  },
};

@Component({
  selector: 'app-holo-badge',
  imports: [Icon],
  host: { class: 'contents' },
  template: `
    <span
      class="inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[0.625rem] font-semibold tracking-[0.14em] uppercase"
      [class]="style().classes"
    >
      @if (tier() === 'live') {
        <span class="size-1.5 animate-breathe rounded-full bg-current"></span>
      } @else {
        <app-icon name="verified" class="size-3" [strokeWidth]="1.4" />
      }
      {{ style().label }}
    </span>
  `,
})
export class HoloBadge {
  readonly tier = input.required<BadgeTier>();

  protected readonly style = computed(() => STYLES[this.tier()]);
}
