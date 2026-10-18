import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommentsSheet } from '../features/comments/comments-sheet';
import { CommentsThread } from '../features/comments/comments-thread';
import { HudPanel } from '../features/trends/hud-panel';
import { CommentsStore } from '../core/state/comments-store';
import { FeedStore } from '../core/state/feed-store';
import { Viewport } from '../core/state/viewport';
import { ToastHost } from '../ui/toast-host';
import { MobileTabBar } from './mobile-tab-bar';
import { MobileTopBar } from './mobile-top-bar';
import { NavDock } from './nav-dock';

/**
 * Armazón de la aplicación: 3 columnas en escritorio, 1 en móvil.
 *
 * El `<router-outlet>` va envuelto en un `<section>` porque el router inserta
 * el componente como hermano del outlet: sin el envoltorio habría dos hijos de
 * la rejilla (el outlet vacío y la página) y el layout de 2 columnas se
 * rompería.
 *
 * El dock y las barras móviles son `fixed`, así que no participan en la
 * rejilla; el espacio se reserva con `md:pl-[6.5rem]`.
 *
 * Los comentarios del clip reutilizan la columna derecha en vez de abrir una
 * cuarta columna: el marco de video está limitado por la altura, así que
 * conmutar el contenido de esa columna no cambia ni un píxel del reproductor
 * y no hay reflujo al abrir el hilo. Donde no hay columna derecha, el hilo se
 * presenta como hoja modal.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    NavDock,
    MobileTabBar,
    MobileTopBar,
    HudPanel,
    CommentsThread,
    CommentsSheet,
    ToastHost,
  ],
  host: { class: 'block h-dvh overflow-hidden' },
  template: `
    <a
      href="#contenido"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-carbon focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
    >
      Saltar al contenido
    </a>

    <app-nav-dock />
    <app-mobile-top-bar />

    <div
      class="mx-auto grid h-dvh w-full max-w-[1680px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-5 lg:pr-5 md:pl-[6.5rem]"
    >
      <section id="contenido" tabindex="-1" class="relative min-h-0 focus:outline-none">
        <router-outlet />
      </section>

      <div class="hidden min-h-0 py-5 lg:block">
        @if (sidePanelThread(); as clip) {
          <app-comments-thread
            class="glass edge-gradient h-full overflow-hidden rounded-glass border border-white/10 shadow-hud"
            [clip]="clip"
            [autoFocus]="true"
          />
        } @else {
          <app-hud-panel />
        }
      </div>
    </div>

    <app-mobile-tab-bar />
    <app-toast-host />

    @if (sheetThread(); as clip) {
      <app-comments-sheet [clip]="clip" />
    }
  `,
})
export class AppShell {
  private readonly feed = inject(FeedStore);
  private readonly comments = inject(CommentsStore);
  private readonly viewport = inject(Viewport);

  /** Hilo en la columna derecha (sustituye al HUD mientras está abierto). */
  protected readonly sidePanelThread = computed(() =>
    this.comments.open() && this.viewport.hasSidePanel() ? this.feed.activeClip() : null,
  );

  /** Hilo como hoja modal cuando no hay columna derecha. */
  protected readonly sheetThread = computed(() =>
    this.comments.open() && !this.viewport.hasSidePanel() ? this.feed.activeClip() : null,
  );
}
