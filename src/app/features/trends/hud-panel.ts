import { Component, computed, inject } from '@angular/core';
import { FeedStore } from '../../core/state/feed-store';
import { Icon } from '../../ui/icon';
import { CreatorsCard } from './creators-card';
import { LiveCommentsCard } from './live-comments-card';
import { TelemetryCard } from './telemetry-card';
import { TrendingCard } from './trending-card';

/**
 * Columna derecha: tendencias y telemetría.
 *
 * Solo se monta desde `lg` (el armazón la oculta con `hidden lg:block`), y con
 * ella el intervalo de comentarios en vivo: en móvil no hay panel, así que
 * tampoco hay trabajo en segundo plano.
 */
@Component({
  selector: 'app-hud-panel',
  imports: [TelemetryCard, TrendingCard, CreatorsCard, LiveCommentsCard, Icon],
  template: `
    <aside
      class="scrollbar-none flex h-full flex-col gap-4 overflow-y-auto"
      aria-label="Tendencias y telemetría"
    >
      <!-- Buscador -->
      <label
        class="glass edge-gradient edge-live flex items-center gap-2.5 rounded-glass px-3.5 py-2.5"
      >
        <app-icon name="search" class="size-4 shrink-0 text-ink-faint" />
        <span class="sr-only">Buscar clips, sonidos o creadores</span>
        <input
          type="search"
          placeholder="Buscar clips, sonidos, creadores"
          class="w-full bg-transparent text-[0.8125rem] text-ink placeholder:text-ink-faint focus:outline-none"
        />
      </label>

      <app-telemetry-card />
      <app-trending-card />
      <app-creators-card />

      <!-- Los comentarios en vivo son del directo, no del clip: solo tienen
           sentido cuando quien publica está emitiendo. En un video corto la
           conversación va en el hilo del clip, que abre la barra lateral. -->
      @if (isLive()) {
        <app-live-comments-card />
      }

      <!-- Pie: estado de la sesión en tipografía de métrica. -->
      <p
        class="metric mt-auto flex items-center justify-between px-1 text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase"
      >
        <span>clip {{ feed.activeIndex() + 1 }}/{{ feed.total() }}</span>
        <span class="flex items-center gap-1.5">
          <span class="size-1.5 animate-breathe rounded-full bg-neon-cyan"></span>
          enlace estable
        </span>
      </p>
    </aside>
  `,
})
export class HudPanel {
  protected readonly feed = inject(FeedStore);

  /**
   * Al desmontarse la tarjeta se para también su temporizador: el stream
   * simulado no corre mientras se ven clips grabados.
   */
  protected readonly isLive = computed(() => this.feed.activeClip()?.creator.badge === 'live');
}
