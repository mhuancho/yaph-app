import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedStore } from '../../core/state/feed-store';
import { TrendsStore } from '../../core/state/trends-store';
import { AvatarOrb } from '../../ui/avatar-orb';
import { HoloBadge } from '../../ui/holo-badge';
import { HudCard } from '../../ui/hud-card';
import { CompactPipe } from '../../ui/metric-pipes';

@Component({
  selector: 'app-creators-card',
  imports: [HudCard, AvatarOrb, HoloBadge, CompactPipe, RouterLink],
  host: { class: 'block' },
  template: `
    <app-hud-card heading="Creadores sugeridos" icon="users">
      <ul class="space-y-3">
        @for (item of trends.suggested(); track item.creator.id) {
          <li class="flex items-center gap-3">
            <app-avatar-orb [creator]="item.creator" size="sm" />

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <a
                  [routerLink]="['/perfil', item.creator.handle]"
                  class="truncate text-[0.8125rem] font-medium text-ink transition-colors hover:text-neon-cyan"
                >
                  {{ item.creator.handle }}
                </a>
                @if (item.creator.badge; as badge) {
                  <app-holo-badge [tier]="badge" />
                }
              </div>
              <p class="metric truncate text-[0.625rem] text-ink-faint">
                {{ item.creator.followers | compact }} · {{ item.reason }}
              </p>
            </div>

            <button
              type="button"
              class="shrink-0 rounded-full border px-3 py-1 text-[0.6875rem] font-semibold transition-[background-color,border-color,color] duration-200"
              [class]="
                feed.isFollowed(item.creator.id)
                  ? 'border-white/20 bg-white/8 text-ink-muted'
                  : 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20'
              "
              [attr.aria-pressed]="feed.isFollowed(item.creator.id)"
              [attr.aria-label]="
                (feed.isFollowed(item.creator.id) ? 'Dejar de seguir a ' : 'Seguir a ') +
                item.creator.handle
              "
              (click)="feed.toggleFollow(item.creator.id)"
            >
              {{ feed.isFollowed(item.creator.id) ? 'Siguiendo' : 'Seguir' }}
            </button>
          </li>
        }
      </ul>
    </app-hud-card>
  `,
})
export class CreatorsCard {
  protected readonly trends = inject(TrendsStore);
  protected readonly feed = inject(FeedStore);
}
