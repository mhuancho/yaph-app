import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HudPanel } from '../features/trends/hud-panel';
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
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, NavDock, MobileTabBar, MobileTopBar, HudPanel],
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

      <app-hud-panel class="hidden min-h-0 lg:block" />
    </div>

    <app-mobile-tab-bar />
  `,
})
export class AppShell {}
