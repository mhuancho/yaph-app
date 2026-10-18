import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../ui/icon';
import { NAV_ITEMS } from './nav-items';

/**
 * Barra inferior (móvil).
 *
 * El relleno inferior usa `env(safe-area-inset-bottom)` para no quedar debajo
 * del indicador de gestos en iOS, y `max()` garantiza un mínimo táctil en los
 * dispositivos sin notch.
 */
@Component({
  selector: 'app-mobile-tab-bar',
  imports: [RouterLink, RouterLinkActive, Icon],
  host: { class: 'contents' },
  template: `
    <nav
      aria-label="Navegación principal"
      class="glass fixed inset-x-0 bottom-0 z-40 border-t border-white/10 md:hidden"
    >
      <ul
        class="flex items-end justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        @for (item of navItems; track item.path) {
          <li class="flex-1">
            @if (item.icon === 'create') {
              <!-- "Crear" rompe la rejilla a propósito: es la acción primaria
                   y el único control con relleno degradado de toda la app. -->
              <a
                [routerLink]="item.path"
                [attr.aria-label]="item.label"
                class="mx-auto grid h-10 w-14 place-items-center rounded-xl bg-[linear-gradient(130deg,var(--color-neon-cyan),var(--color-neon-magenta))] text-abyss shadow-neon-cyan transition-transform duration-200 active:scale-95"
              >
                <app-icon name="create" class="size-6" [strokeWidth]="2.2" />
              </a>
            } @else {
              <a
                [routerLink]="item.path"
                routerLinkActive="text-neon-cyan"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                #active="routerLinkActive"
                [attr.aria-current]="active.isActive ? 'page' : null"
                class="relative mx-auto flex h-10 w-14 flex-col items-center justify-center gap-1 rounded-xl text-ink-muted transition-colors duration-200 active:bg-white/5"
              >
                <app-icon [name]="item.icon" class="size-[1.3rem]" />
                <span class="text-[0.5625rem] font-medium tracking-wide">{{ item.label }}</span>

                @if (item.badge !== null) {
                  <span
                    class="metric absolute top-0 right-1.5 grid min-w-4 place-items-center rounded-full bg-neon-magenta px-1 text-[0.5625rem] font-bold text-abyss"
                  >
                    {{ item.badge }}
                    <span class="sr-only">sin leer</span>
                  </span>
                }
              </a>
            }
          </li>
        }
      </ul>
    </nav>
  `,
})
export class MobileTabBar {
  protected readonly navItems = NAV_ITEMS;
}
