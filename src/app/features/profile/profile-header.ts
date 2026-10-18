import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CreatorProfile } from '../../core/models/feed';
import { FeedStore } from '../../core/state/feed-store';
import { I18nStore } from '../../core/i18n/i18n-store';
import { ProfileStore } from '../../core/state/profile-store';
import { ShareService } from '../../core/state/share-service';
import { AvatarOrb } from '../../ui/avatar-orb';
import { HoloBadge } from '../../ui/holo-badge';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';

/**
 * Cabecera de un perfil: identidad, contadores y acciones.
 *
 * El estado «en directo» no es una bandera del perfil sino una consecuencia de
 * tener una publicación emitiendo, así que el anillo del avatar y el perfil no
 * pueden contradecirse.
 */
@Component({
  selector: 'app-profile-header',
  imports: [AvatarOrb, HoloBadge, Icon, CompactPipe, RouterLink],
  host: { class: 'block' },
  styles: `
    /* Anillo del directo: un cónico girando bajo el avatar, recortado a un
     * aro con mask. El CSS global lo detiene con prefers-reduced-motion. */
    .live-ring {
      background: conic-gradient(
        from 0deg,
        var(--color-neon-magenta),
        var(--color-neon-cyan),
        var(--color-neon-violet),
        var(--color-neon-magenta)
      );
      mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
      animation: live-spin 4s linear infinite;
    }

    @keyframes live-spin {
      to {
        transform: rotate(1turn);
      }
    }
  `,
  template: `
    <div
      class="flex flex-col items-center gap-5 text-center md:flex-row md:items-start md:text-left"
    >
      <div class="relative shrink-0">
        @if (profiles.isLive()) {
          <span aria-hidden="true" class="live-ring absolute -inset-1.5 rounded-full"></span>
        }
        <app-avatar-orb class="relative" [creator]="profile()" size="xl" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          <h1 class="font-display text-xl font-semibold tracking-tight text-ink">
            {{ profile().displayName }}
          </h1>
          @if (profile().badge; as badge) {
            <app-holo-badge [tier]="badge" />
          }
        </div>
        <p class="metric mt-0.5 text-[0.8125rem] text-ink-muted">{{ profile().handle }}</p>

        <!-- Contadores en monoespaciada y tabulares: cambian al seguir y no
             deben desplazar el resto de la fila. -->
        <dl class="mt-4 flex justify-center gap-6 md:justify-start">
          <div>
            <dt class="sr-only">{{ i18n.t('profile.following') }}</dt>
            <dd class="metric text-base font-semibold text-ink">
              {{ profile().following | compact }}
            </dd>
            <p class="metric text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">
              {{ i18n.t('profile.following') }}
            </p>
          </div>
          <div>
            <dt class="sr-only">{{ i18n.t('profile.followers') }}</dt>
            <dd class="metric text-base font-semibold text-ink">
              {{ profiles.followerCount(profile()) | compact }}
            </dd>
            <p class="metric text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">
              {{ i18n.t('profile.followers') }}
            </p>
          </div>
          <div>
            <dt class="sr-only">{{ i18n.t('profile.likes') }}</dt>
            <dd class="metric text-base font-semibold text-ink">
              {{ profile().likes | compact }}
            </dd>
            <p class="metric text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">
              {{ i18n.t('profile.likes') }}
            </p>
          </div>
        </dl>

        <div class="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
          @if (profiles.isMe()) {
            <!-- Editar lleva a la pantalla de identidad: es el mismo
                 formulario con el que se entró, no una copia. -->
            <a
              routerLink="/acceder"
              class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-ink transition-colors duration-200 hover:border-neon-cyan/50 hover:text-neon-cyan"
            >
              <app-icon name="edit" class="size-3.5" />
              {{ i18n.t('action.edit.profile') }}
            </a>
            <button
              type="button"
              class="grid size-9 place-items-center rounded-full border border-white/15 text-ink-muted transition-colors duration-200 hover:border-neon-cyan/50 hover:text-neon-cyan"
              [attr.aria-label]="i18n.t('action.share')"
              (click)="shareProfile()"
            >
              <app-icon name="share" class="size-4" />
            </button>
          } @else {
            <button
              type="button"
              class="rounded-full border px-5 py-2 text-xs font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
              [class]="followClass()"
              [attr.aria-pressed]="followed()"
              (click)="profiles.toggleFollow(profile().id)"
            >
              {{ followed() ? i18n.t('action.following') : i18n.t('action.follow') }}
            </button>
            <a
              [routerLink]="['/mensajes']"
              [queryParams]="{ con: profile().handle }"
              class="grid size-9 place-items-center rounded-full border border-white/15 text-ink-muted transition-colors duration-200 hover:border-neon-cyan/50 hover:text-neon-cyan"
              [attr.aria-label]="'Enviar mensaje a ' + profile().handle"
            >
              <app-icon name="messages" class="size-4" />
            </a>
          }

          @if (profiles.isLive()) {
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-neon-magenta/60 bg-neon-magenta/15 px-4 py-2 text-xs font-semibold text-ink shadow-neon-magenta transition-transform duration-200 hover:-translate-y-0.5"
              (click)="watchLive()"
            >
              <span class="size-1.5 animate-breathe rounded-full bg-neon-magenta"></span>
              {{ i18n.t('action.watch.live') }}
              @if (liveViewers(); as viewers) {
                <span class="metric text-ink-muted">{{ viewers | compact }}</span>
              }
            </button>
          }
        </div>

        <p class="mt-4 max-w-prose text-[0.8125rem] leading-relaxed text-ink/90">
          {{ profile().bio }}
        </p>

        @if (profile().link; as link) {
          <a
            [href]="'https://' + link"
            target="_blank"
            rel="noopener noreferrer nofollow"
            class="metric mt-1.5 inline-flex items-center gap-1.5 text-[0.75rem] text-neon-cyan transition-opacity hover:opacity-80"
          >
            <app-icon name="explore" class="size-3.5" />
            {{ link }}
          </a>
        }
      </div>
    </div>
  `,
})
export class ProfileHeader {
  readonly profile = input.required<CreatorProfile>();

  protected readonly profiles = inject(ProfileStore);
  protected readonly i18n = inject(I18nStore);
  private readonly feed = inject(FeedStore);
  private readonly router = inject(Router);
  private readonly sharing = inject(ShareService);

  protected shareProfile(): void {
    const profile = this.profile();
    void this.sharing.share({
      title: `${profile.displayName} en YAPH`,
      text: profile.bio,
      path: `/perfil/${profile.handle}`,
    });
  }

  protected readonly liveViewers = computed(() => this.profiles.liveClip()?.liveViewers ?? null);

  protected followed(): boolean {
    return this.profiles.isFollowed(this.profile().id);
  }

  protected readonly followClass = computed(() =>
    this.followed()
      ? 'border-white/20 bg-white/8 text-ink-muted'
      : 'border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan',
  );

  protected watchLive(): void {
    const live = this.profiles.liveClip();
    if (!live) return;

    this.feed.playCollection(this.profiles.collectionFor(this.profile()), live.id);
    void this.router.navigate(['/']);
  }
}
