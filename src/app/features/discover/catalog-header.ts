import { Component, input, output } from '@angular/core';
import { AccentPair } from '../../core/models/feed';
import { Icon, IconName } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';

/**
 * Cabecera compartida por las páginas de hashtag y de sonido: un disco con el
 * acento del contenido, el título, dos cifras y una acción. Las dos páginas
 * son el mismo listado con distinta etiqueta, así que comparten cabecera en
 * vez de duplicarla con variaciones que se desincronizan.
 */
@Component({
  selector: 'app-catalog-header',
  imports: [Icon, CompactPipe],
  host: { class: 'block' },
  template: `
    <div class="flex items-center gap-4">
      <span
        aria-hidden="true"
        class="grid size-20 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(140deg,var(--glow-from),var(--glow-to))] text-abyss"
        [style.--glow-from]="accent().from"
        [style.--glow-to]="accent().to"
      >
        <app-icon [name]="icon()" class="size-8" [strokeWidth]="2" />
      </span>

      <div class="min-w-0 flex-1">
        <h1 class="truncate font-display text-xl font-semibold tracking-tight text-ink">
          {{ title() }}
        </h1>
        @if (subtitle(); as text) {
          <p class="metric mt-0.5 truncate text-[0.8125rem] text-ink-muted">{{ text }}</p>
        }

        <p class="metric mt-2 flex flex-wrap gap-x-4 text-[0.6875rem] text-ink-faint">
          <span>{{ clipCount() | compact }} publicaciones</span>
          <span>{{ viewCount() | compact }} reproducciones</span>
        </p>
      </div>
    </div>

    <button
      type="button"
      class="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
      [class]="
        active()
          ? 'border-white/20 bg-white/8 text-ink-muted'
          : 'border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
      "
      [attr.aria-pressed]="active()"
      (click)="toggle.emit()"
    >
      <app-icon [name]="actionIcon()" class="size-3.5" />
      {{ active() ? activeLabel() : actionLabel() }}
    </button>
  `,
})
export class CatalogHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly icon = input.required<IconName>();
  readonly accent = input<AccentPair>({ from: '#00F5D4', to: '#7C5CFF' });
  readonly clipCount = input.required<number>();
  readonly viewCount = input.required<number>();
  readonly actionLabel = input.required<string>();
  readonly activeLabel = input.required<string>();
  readonly actionIcon = input.required<IconName>();
  readonly active = input(false);

  readonly toggle = output<void>();
}
