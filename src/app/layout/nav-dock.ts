import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FeedStore } from '../core/state/feed-store';
import { Icon } from '../ui/icon';
import { BrandMark } from './brand-mark';
import { NAV_ITEMS, NavItem } from './nav-items';

/**
 * Dock lateral flotante (desktop).
 *
 * `position: fixed` + `glass`: vive sobre el fondo estático de la página, así
 * que el `backdrop-filter` se compone una sola vez y no se repinta con el
 * scroll del feed.
 */
@Component({
  selector: 'app-nav-dock',
  imports: [RouterLink, RouterLinkActive, Icon, BrandMark],
  host: { class: 'contents' },
  template: `
    <nav
      aria-label="Navegación principal"
      class="fixed top-1/2 left-5 z-40 hidden -translate-y-1/2 md:block"
    >
      <div
        class="glass edge-gradient edge-live flex flex-col items-center gap-2 rounded-[1.75rem] p-2.5 shadow-hud"
      >
        <a
          routerLink="/"
          class="mb-1 rounded-xl"
          aria-label="YAPH, ir al inicio"
          (click)="feed.resetToForYou()"
        >
          <app-brand-mark />
        </a>

        <ul class="flex flex-col items-center gap-1">
          @for (item of navItems; track item.path) {
            <li class="group relative">
              <a
                [routerLink]="item.path"
                (click)="onNavigate(item)"
                routerLinkActive="text-neon-cyan bg-neon-cyan/10 shadow-neon-cyan"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                #active="routerLinkActive"
                [attr.aria-current]="active.isActive ? 'page' : null"
                [attr.aria-label]="item.label"
                class="relative grid size-12 place-items-center rounded-2xl border border-transparent text-ink-muted transition-[color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/5 hover:text-ink"
              >
                <app-icon [name]="item.icon" class="size-[1.35rem]" />

                @if (item.badge !== null) {
                  <span
                    class="metric absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-neon-magenta px-1 text-[0.5625rem] font-bold text-abyss"
                  >
                    {{ item.badge }}
                    <span class="sr-only">sin leer</span>
                  </span>
                }
              </a>

              <!-- Etiqueta en hover. Es aria-hidden porque el enlace ya tiene
                   su propio aria-label: anunciarla dos veces sería ruido. -->
              <span
                aria-hidden="true"
                class="glass pointer-events-none absolute top-1/2 left-full ml-3 border border-white/10 -translate-y-1/2 scale-95 rounded-lg px-2.5 py-1 text-xs whitespace-nowrap text-ink opacity-0 transition-[opacity,transform] duration-200 group-hover:scale-100 group-hover:opacity-100"
              >
                {{ item.label }}
              </span>
            </li>
          }
        </ul>

        <hr class="my-1 h-px w-8 border-0 bg-white/10" />

        <button
          type="button"
          class="grid size-11 place-items-center rounded-2xl border border-transparent text-ink-muted transition-colors duration-200 hover:border-white/10 hover:bg-white/5 hover:text-neon-cyan"
          [attr.aria-pressed]="feed.muted()"
          [attr.aria-label]="feed.muted() ? 'Activar sonido' : 'Silenciar'"
          (click)="feed.toggleMute()"
        >
          <app-icon [name]="feed.muted() ? 'volume-off' : 'volume-on'" class="size-5" />
        </button>
      </div>
    </nav>
  `,
})
export class NavDock {
  protected readonly feed = inject(FeedStore);
  protected readonly navItems = NAV_ITEMS;

  /**
   * Pulsar «Inicio» devuelve a la recomendación general. Sin esto, quien
   * entró a un video desde un perfil seguiría recorriendo esa colección sin
   * forma evidente de salir.
   */
  protected onNavigate(item: NavItem): void {
    if (item.exact) this.feed.resetToForYou();
  }
}
