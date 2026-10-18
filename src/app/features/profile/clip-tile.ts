import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CreatorProfile, VideoClip } from '../../core/models/feed';
import { FeedStore } from '../../core/state/feed-store';
import { ProfileStore } from '../../core/state/profile-store';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';

/**
 * Miniatura de la parrilla.
 *
 * Al abrirla, el feed pasa a reproducir las publicaciones de ese perfil
 * empezando por este clip: el scroll vertical recorre la obra de esa persona y
 * no la recomendación general, que es lo que hace cualquier feed vertical al
 * entrar desde un perfil.
 *
 * No monta un `<video>`: una parrilla de 12 miniaturas serían 12
 * decodificadores. Se dibuja el póster procedural del clip, el mismo que usa
 * el reproductor mientras carga, así que la miniatura y el video coinciden.
 *
 * La celda es 3:4 y no 9:16: recorta el vertical, como cualquier parrilla de
 * perfil, y así caben dos filas de un vistazo en vez de una.
 */
@Component({
  selector: 'app-clip-tile',
  imports: [Icon, CompactPipe],
  host: { class: 'block' },
  template: `
    <button
      type="button"
      class="group relative block aspect-[3/4] w-full overflow-hidden bg-carbon"
      [style.--glow-from]="clip().accent.from"
      [style.--glow-to]="clip().accent.to"
      [attr.aria-label]="label()"
      (click)="open()"
    >
      <span
        class="clip-poster absolute inset-0 transition-transform duration-500 group-hover:scale-105"
      ></span>

      <!-- Degradado inferior para que las métricas se lean sobre cualquier
           póster, sin desenfoque: son capas estáticas, pero la parrilla puede
           tener decenas y el coste se multiplica. -->
      <span
        class="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgb(5_5_8/0.85),transparent)]"
      ></span>

      @if (clip().kind === 'live') {
        <span
          class="metric absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full border border-neon-magenta/60 bg-abyss/70 px-1.5 py-[2px] text-[0.5rem] font-semibold tracking-[0.12em] text-neon-magenta uppercase"
        >
          <span class="size-1 animate-breathe rounded-full bg-current"></span>
          live
        </span>
      } @else if (pinned()) {
        <span
          class="metric absolute top-1.5 left-1.5 rounded-full border border-neon-amber/50 bg-abyss/70 px-1.5 py-[2px] text-[0.5rem] font-semibold tracking-[0.12em] text-neon-amber uppercase"
        >
          fijado
        </span>
      }

      <span
        class="metric absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-ink"
      >
        <app-icon name="play" class="size-3" [filled]="true" [strokeWidth]="1" />
        {{ clip().metrics.views | compact }}
      </span>
    </button>
  `,
})
export class ClipTile {
  readonly clip = input.required<VideoClip>();
  readonly profile = input.required<CreatorProfile>();
  /** Primera publicación: en un perfil hace las veces de clip destacado. */
  readonly pinned = input(false);

  private readonly feed = inject(FeedStore);
  private readonly profiles = inject(ProfileStore);
  private readonly router = inject(Router);

  protected readonly label = computed(
    () => `Reproducir: ${this.clip().description} · ${this.clip().metrics.views} reproducciones`,
  );

  protected open(): void {
    this.feed.playCollection(this.profiles.collectionFor(this.profile()), this.clip().id);
    void this.router.navigate(['/']);
  }
}
