import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VideoClip } from '../../core/models/feed';
import { FeedStore } from '../../core/state/feed-store';
import { AvatarOrb } from '../../ui/avatar-orb';
import { HoloBadge } from '../../ui/holo-badge';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';
import { Soundwave } from '../../ui/soundwave';

/** A partir de esta longitud la descripción se repliega y aparece el toggle. */
const COLLAPSE_THRESHOLD = 110;

/**
 * Capa de información sobre el video: creador, descripción colapsable y audio.
 *
 * Se apoya en un degradado (`scrim`, declarado en `VideoStage`) y no en
 * `backdrop-filter`: es la capa que más superficie comparte con el video en
 * reproducción y desenfocarla es el camino más rápido a perder fotogramas en
 * móvil.
 */
@Component({
  selector: 'app-clip-overlay',
  imports: [AvatarOrb, HoloBadge, Icon, Soundwave, CompactPipe, RouterLink],
  host: { class: 'block' },
  template: `
    <div class="flex flex-col gap-2.5">
      <!-- Creador -->
      <div class="flex items-center gap-2.5">
        <a
          [routerLink]="profileLink()"
          [attr.aria-label]="'Ver el perfil de ' + clip().creator.handle"
        >
          <app-avatar-orb [creator]="clip().creator" size="sm" />
        </a>

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <a
              [routerLink]="profileLink()"
              class="truncate font-display text-sm font-semibold text-ink transition-colors hover:text-neon-cyan"
            >
              {{ clip().creator.handle }}
            </a>
            @if (isLive()) {
              <span
                class="metric inline-flex shrink-0 items-center gap-1 rounded-full border border-neon-magenta/60 bg-neon-magenta/15 px-2 py-[3px] text-[0.5625rem] font-semibold tracking-[0.14em] text-neon-magenta uppercase shadow-neon-magenta"
              >
                <span class="size-1.5 animate-breathe rounded-full bg-current"></span>
                en vivo
              </span>
            } @else if (clip().creator.badge; as badge) {
              <app-holo-badge [tier]="badge" />
            }
          </div>

          <!-- En un directo importa quién está viendo ahora; en un corto, el
               tamaño de la audiencia del creador. -->
          <p class="metric truncate text-[0.6875rem] text-ink-muted">
            @if (isLive()) {
              {{ clip().liveViewers ?? 0 | compact }} viendo ahora
            } @else {
              {{ clip().creator.followers | compact }} seguidores
            }
            @if (clip().location; as location) {
              · {{ location }}
            }
          </p>
        </div>

        <button
          type="button"
          class="ml-auto shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-[background-color,border-color,color,box-shadow] duration-200"
          [class]="followClass()"
          [attr.aria-pressed]="following()"
          (click)="feed.toggleFollow(clip().creator.id)"
        >
          {{ following() ? 'Siguiendo' : 'Seguir' }}
        </button>
      </div>

      <!-- Descripción -->
      <div>
        <p
          [id]="descriptionId()"
          class="max-w-prose text-[0.8125rem] leading-relaxed text-ink/90"
          [class.line-clamp-2]="!expanded()"
        >
          {{ clip().description }}
        </p>

        @if (collapsible()) {
          <button
            type="button"
            class="metric mt-1 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-neon-cyan transition-opacity hover:opacity-80"
            [attr.aria-expanded]="expanded()"
            [attr.aria-controls]="descriptionId()"
            (click)="feed.toggleDescription()"
          >
            {{ expanded() ? 'ver menos' : 'ver más' }}
            <app-icon
              name="chevron-down"
              class="size-3 transition-transform duration-200"
              [class.rotate-180]="expanded()"
            />
          </button>
        }
      </div>

      <!-- Hashtags -->
      <ul class="flex flex-wrap gap-1.5">
        @for (tag of clip().hashtags; track tag) {
          <li>
            <a
              href="#contenido"
              class="metric inline-block rounded-full border border-white/12 px-2 py-[3px] text-[0.6875rem] text-neon-cyan transition-[background-color,border-color] duration-200 hover:border-neon-cyan/50 hover:bg-neon-cyan/10"
            >
              {{ tag }}
            </a>
          </li>
        }
      </ul>

      <!-- Audio original -->
      <div class="flex items-center gap-2.5 text-neon-cyan">
        <app-icon name="music" class="size-3.5 shrink-0" />
        <p class="min-w-0 truncate text-xs text-ink">
          <span class="font-medium">{{ clip().audio.title }}</span>
          <span class="text-ink-muted"> · {{ clip().audio.author }}</span>
        </p>
        <app-soundwave
          class="ml-auto shrink-0"
          [envelope]="clip().audio.envelope"
          [playing]="playing()"
          [bars]="16"
        />
      </div>
    </div>
  `,
})
export class ClipOverlay {
  readonly clip = input.required<VideoClip>();
  /** Solo el clip activo responde al toggle de descripción y anima la onda. */
  readonly active = input(false);
  readonly playing = input(false);

  protected readonly feed = inject(FeedStore);

  protected readonly isLive = computed(() => this.clip().kind === 'live');

  protected readonly profileLink = computed(() => ['/perfil', this.clip().creator.handle]);

  protected readonly descriptionId = computed(() => `clip-desc-${this.clip().id}`);

  /**
   * Heurística por longitud en vez de medir el alto real con `ResizeObserver`:
   * un observer por clip visible para decidir si mostrar un enlace no paga su
   * coste, y el umbral falla como mucho en una línea.
   */
  protected readonly collapsible = computed(
    () => this.clip().description.length > COLLAPSE_THRESHOLD,
  );

  protected readonly expanded = computed(() => this.active() && this.feed.descriptionExpanded());

  protected following(): boolean {
    return this.feed.isFollowed(this.clip().creator.id);
  }

  protected readonly followClass = computed(() =>
    this.following()
      ? 'border-white/20 bg-white/8 text-ink-muted'
      : 'border-neon-magenta/60 bg-neon-magenta/15 text-ink shadow-neon-magenta',
  );
}
