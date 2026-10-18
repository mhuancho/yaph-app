import { Component, inject } from '@angular/core';
import { I18nStore } from '../core/i18n/i18n-store';
import { FeedStore } from '../core/state/feed-store';
import { RouterLink } from '@angular/router';
import { Icon } from '../ui/icon';
import { BrandMark } from './brand-mark';

/**
 * Cabecera móvil.
 *
 * En móvil no hay dock lateral, así que aquí viven la marca y el control de
 * audio. Se superpone al video con un degradado (no con `backdrop-filter`):
 * desenfocar sobre un `<video>` en reproducción obliga al compositor a releer
 * el frame en cada repintado.
 */
@Component({
  selector: 'app-mobile-top-bar',
  imports: [Icon, BrandMark, RouterLink],
  host: { class: 'contents' },
  template: `
    <header
      class="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center gap-3 bg-[linear-gradient(180deg,rgb(5_5_8/0.85),transparent)] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6 md:hidden"
    >
      <app-brand-mark class="pointer-events-auto" [showWordmark]="true" />

      <div class="ml-auto flex items-center gap-2">
        <a
          routerLink="/buscar"
          class="glass-flat pointer-events-auto grid size-9 place-items-center rounded-full border border-white/12 text-ink-muted transition-colors active:text-neon-cyan"
          [attr.aria-label]="i18n.t('action.search')"
        >
          <app-icon name="search" class="size-[1.1rem]" />
        </a>

        <button
          type="button"
          class="glass-flat pointer-events-auto grid size-9 place-items-center rounded-full border border-white/12 text-ink-muted transition-colors active:text-neon-cyan"
          [attr.aria-pressed]="feed.muted()"
          [attr.aria-label]="feed.muted() ? i18n.t('action.unmute') : i18n.t('action.mute')"
          (click)="feed.toggleMute()"
        >
          <app-icon [name]="feed.muted() ? 'volume-off' : 'volume-on'" class="size-[1.1rem]" />
        </button>
      </div>
    </header>
  `,
})
export class MobileTopBar {
  protected readonly feed = inject(FeedStore);
  protected readonly i18n = inject(I18nStore);
}
