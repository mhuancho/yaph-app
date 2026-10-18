import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../ui/icon';
import { I18nStore } from '../core/i18n/i18n-store';
import { FeedStore } from '../core/state/feed-store';
import { MessagesStore } from '../core/state/messages-store';
import { NotificationsStore } from '../core/state/notifications-store';
import { NAV_ITEMS, NavItem } from './nav-items';

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
      [attr.aria-label]="i18n.t('nav.main')"
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
                [attr.aria-label]="i18n.t(item.label)"
                class="mx-auto grid h-10 w-14 place-items-center rounded-xl bg-[linear-gradient(130deg,var(--color-neon-cyan),var(--color-neon-magenta))] text-abyss shadow-neon-cyan transition-transform duration-200 active:scale-95"
              >
                <app-icon name="create" class="size-6" [strokeWidth]="2.2" />
              </a>
            } @else {
              <a
                [routerLink]="item.path"
                (click)="onNavigate(item)"
                routerLinkActive="text-neon-cyan"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                #active="routerLinkActive"
                [attr.aria-current]="active.isActive ? 'page' : null"
                class="relative mx-auto flex h-10 w-14 flex-col items-center justify-center gap-1 rounded-xl text-ink-muted transition-colors duration-200 active:bg-white/5"
              >
                <app-icon [name]="item.icon" class="size-[1.3rem]" />
                <span class="text-[0.5625rem] font-medium tracking-wide">{{
                  i18n.t(item.label)
                }}</span>

                @if (badgeFor(item); as count) {
                  <span
                    class="metric absolute top-0 right-1.5 grid min-w-4 place-items-center rounded-full bg-neon-magenta px-1 text-[0.5625rem] font-bold text-abyss"
                  >
                    {{ count }}
                    <span class="sr-only">{{ i18n.t('nav.unread') }}</span>
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
  private readonly messages = inject(MessagesStore);
  private readonly notifications = inject(NotificationsStore);

  /** `0` es falsy, así que `@if (…; as count)` oculta la insignia vacía. */
  protected badgeFor(item: NavItem): number {
    if (item.badge !== 'mensajes') return 0;
    // Una sola bandeja, una sola cifra: mensajes y actividad juntos.
    return this.messages.unreadTotal() + this.notifications.unreadTotal();
  }

  private readonly feed = inject(FeedStore);
  protected readonly navItems = NAV_ITEMS;
  protected readonly i18n = inject(I18nStore);

  /** Igual que en el dock: «Inicio» vuelve a la recomendación general. */
  protected onNavigate(item: NavItem): void {
    if (item.exact) this.feed.resetToForYou();
  }
}
